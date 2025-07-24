-- Advanced Search Functions
-- =========================
-- Full-text search, autocomplete, geolocation, and recommendations

-- ===================================
-- FULL-TEXT SEARCH FUNCTIONS
-- ===================================

-- Advanced event search with filters and ranking
CREATE OR REPLACE FUNCTION search_events(
  search_query text DEFAULT '',
  event_status varchar(20) DEFAULT NULL,
  location_filter text DEFAULT NULL,
  date_from date DEFAULT NULL,
  date_to date DEFAULT NULL,
  tags_filter text[] DEFAULT NULL,
  max_distance_km numeric DEFAULT NULL,
  user_lat numeric DEFAULT NULL,
  user_lng numeric DEFAULT NULL,
  limit_count integer DEFAULT 20,
  offset_count integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  location text,
  date date,
  time time,
  latitude numeric,
  longitude numeric,
  organizer_id uuid,
  organizer_username text,
  status varchar(20),
  search_tags text[],
  popularity_score integer,
  search_rank real,
  distance_km numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.description,
    e.location,
    e.date,
    e.time,
    e.latitude,
    e.longitude,
    e.organizer_id,
    p.username as organizer_username,
    e.status,
    e.search_tags,
    e.popularity_score,
    CASE 
      WHEN search_query = '' THEN 0
      ELSE ts_rank_cd(e.search_vector, plainto_tsquery('english', search_query))
    END as search_rank,
    CASE 
      WHEN user_lat IS NOT NULL AND user_lng IS NOT NULL AND e.location_point IS NOT NULL
      THEN ST_Distance(
        ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
        e.location_point::geography
      ) / 1000
      ELSE NULL
    END as distance_km
  FROM events e
  LEFT JOIN profiles p ON e.organizer_id = p.id
  WHERE 
    -- Status filter
    (event_status IS NULL OR e.status = event_status)
    -- Date range filter
    AND (date_from IS NULL OR e.date >= date_from)
    AND (date_to IS NULL OR e.date <= date_to)
    -- Location filter (fuzzy match)
    AND (
      location_filter IS NULL 
      OR e.location ILIKE '%' || location_filter || '%'
      OR similarity(e.location, location_filter) > 0.3
    )
    -- Tags filter
    AND (
      tags_filter IS NULL 
      OR e.search_tags && tags_filter
    )
    -- Distance filter
    AND (
      max_distance_km IS NULL 
      OR user_lat IS NULL 
      OR user_lng IS NULL 
      OR e.location_point IS NULL
      OR ST_Distance(
        ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
        e.location_point::geography
      ) / 1000 <= max_distance_km
    )
    -- Text search filter
    AND (
      search_query = '' 
      OR e.search_vector @@ plainto_tsquery('english', search_query)
      OR similarity(e.title, search_query) > 0.2
    )
  ORDER BY 
    -- Ranking priority: exact matches, then similarity, then popularity, then distance
    CASE WHEN search_query = '' THEN 0 ELSE ts_rank_cd(e.search_vector, plainto_tsquery('english', search_query)) END DESC,
    similarity(e.title, search_query) DESC,
    e.popularity_score DESC,
    distance_km ASC NULLS LAST
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================
-- AUTOCOMPLETE FUNCTIONS
-- ===================================

-- Event title autocomplete
CREATE OR REPLACE FUNCTION autocomplete_event_titles(
  partial_query text,
  limit_count integer DEFAULT 10
)
RETURNS TABLE (
  suggestion text,
  category text,
  popularity integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.title as suggestion,
    'event' as category,
    e.popularity_score as popularity
  FROM events e
  WHERE 
    e.title % partial_query
    OR e.title ILIKE partial_query || '%'
    OR e.search_vector @@ to_tsquery('english', partial_query || ':*')
  ORDER BY 
    similarity(e.title, partial_query) DESC,
    e.popularity_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Location autocomplete
CREATE OR REPLACE FUNCTION autocomplete_locations(
  partial_query text,
  limit_count integer DEFAULT 10
)
RETURNS TABLE (
  suggestion text,
  category text,
  usage_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.location as suggestion,
    'location' as category,
    COUNT(*) as usage_count
  FROM events e
  WHERE 
    e.location IS NOT NULL
    AND (
      e.location % partial_query
      OR e.location ILIKE partial_query || '%'
    )
  GROUP BY e.location
  ORDER BY 
    similarity(e.location, partial_query) DESC,
    usage_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tags autocomplete
CREATE OR REPLACE FUNCTION autocomplete_tags(
  partial_query text,
  limit_count integer DEFAULT 10
)
RETURNS TABLE (
  suggestion text,
  category text,
  usage_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tag as suggestion,
    'tag' as category,
    COUNT(*) as usage_count
  FROM events e,
  LATERAL unnest(e.search_tags) as tag
  WHERE 
    tag % partial_query
    OR tag ILIKE partial_query || '%'
  GROUP BY tag
  ORDER BY 
    similarity(tag, partial_query) DESC,
    usage_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Combined autocomplete
CREATE OR REPLACE FUNCTION autocomplete_all(
  partial_query text,
  limit_count integer DEFAULT 15
)
RETURNS TABLE (
  suggestion text,
  category text,
  relevance_score numeric
) AS $$
BEGIN
  RETURN QUERY
  -- Event titles
  SELECT 
    t.suggestion,
    t.category,
    similarity(t.suggestion, partial_query) + (t.popularity::numeric / 1000) as relevance_score
  FROM autocomplete_event_titles(partial_query, limit_count/3) t
  
  UNION ALL
  
  -- Locations
  SELECT 
    l.suggestion,
    l.category,
    similarity(l.suggestion, partial_query) + (l.usage_count::numeric / 100) as relevance_score
  FROM autocomplete_locations(partial_query, limit_count/3) l
  
  UNION ALL
  
  -- Tags
  SELECT 
    tg.suggestion,
    tg.category,
    similarity(tg.suggestion, partial_query) + (tg.usage_count::numeric / 50) as relevance_score
  FROM autocomplete_tags(partial_query, limit_count/3) tg
  
  ORDER BY relevance_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================
-- GEOLOCATION SEARCH FUNCTIONS
-- ===================================

-- Find events near location
CREATE OR REPLACE FUNCTION search_events_near_location(
  latitude numeric,
  longitude numeric,
  radius_km numeric DEFAULT 50,
  search_query text DEFAULT '',
  limit_count integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  location text,
  date date,
  time time,
  latitude numeric,
  longitude numeric,
  distance_km numeric,
  search_rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.description,
    e.location,
    e.date,
    e.time,
    e.latitude,
    e.longitude,
    ST_Distance(
      ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
      e.location_point::geography
    ) / 1000 as distance_km,
    CASE 
      WHEN search_query = '' THEN 0
      ELSE ts_rank_cd(e.search_vector, plainto_tsquery('english', search_query))
    END as search_rank
  FROM events e
  WHERE 
    e.location_point IS NOT NULL
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
      e.location_point::geography,
      radius_km * 1000
    )
    AND (
      search_query = '' 
      OR e.search_vector @@ plainto_tsquery('english', search_query)
    )
    AND e.status = 'approved'
  ORDER BY 
    search_rank DESC,
    distance_km ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================
-- RECOMMENDATION FUNCTIONS
-- ===================================

-- Content-based recommendations
CREATE OR REPLACE FUNCTION get_content_recommendations(
  target_user_id uuid,
  limit_count integer DEFAULT 10
)
RETURNS TABLE (
  event_id uuid,
  title text,
  description text,
  location text,
  date date,
  similarity_score numeric,
  recommendation_reason text
) AS $$
BEGIN
  RETURN QUERY
  WITH user_preferences AS (
    -- Get user's interaction history to understand preferences
    SELECT 
      array_agg(DISTINCT tag) as preferred_tags,
      array_agg(DISTINCT e.location) as preferred_locations
    FROM user_interactions ui
    JOIN events e ON ui.event_id = e.id
    CROSS JOIN LATERAL unnest(e.search_tags) as tag
    WHERE ui.user_id = target_user_id
    AND ui.interaction_type IN ('attend', 'like')
  ),
  recommendations AS (
    SELECT 
      e.id as event_id,
      e.title,
      e.description,
      e.location,
      e.date,
      -- Calculate similarity based on tags and location
      (
        CASE 
          WHEN up.preferred_tags && e.search_tags THEN 
            (array_length(up.preferred_tags & e.search_tags, 1)::numeric / 
             greatest(array_length(up.preferred_tags, 1), array_length(e.search_tags, 1))) * 0.7
          ELSE 0
        END +
        CASE 
          WHEN e.location = ANY(up.preferred_locations) THEN 0.3
          ELSE 0
        END
      ) as similarity_score,
      'Based on your interests in ' || 
      array_to_string(up.preferred_tags & e.search_tags, ', ') as recommendation_reason
    FROM events e
    CROSS JOIN user_preferences up
    WHERE 
      e.status = 'approved'
      AND e.date >= CURRENT_DATE
      AND NOT EXISTS (
        SELECT 1 FROM user_interactions ui 
        WHERE ui.user_id = target_user_id 
        AND ui.event_id = e.id
      )
      AND (up.preferred_tags && e.search_tags OR e.location = ANY(up.preferred_locations))
  )
  SELECT 
    r.event_id,
    r.title,
    r.description,
    r.location,
    r.date,
    r.similarity_score,
    r.recommendation_reason
  FROM recommendations r
  WHERE r.similarity_score > 0.1
  ORDER BY r.similarity_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Collaborative filtering recommendations
CREATE OR REPLACE FUNCTION get_collaborative_recommendations(
  target_user_id uuid,
  limit_count integer DEFAULT 10
)
RETURNS TABLE (
  event_id uuid,
  title text,
  description text,
  location text,
  date date,
  affinity_score numeric,
  recommendation_reason text
) AS $$
BEGIN
  RETURN QUERY
  WITH similar_users AS (
    -- Find users with similar interaction patterns
    SELECT 
      ui2.user_id,
      COUNT(*) as common_events,
      COUNT(*) / (
        SELECT COUNT(DISTINCT event_id) 
        FROM user_interactions 
        WHERE user_id = target_user_id
      )::numeric as affinity_score
    FROM user_interactions ui1
    JOIN user_interactions ui2 ON ui1.event_id = ui2.event_id
    WHERE 
      ui1.user_id = target_user_id
      AND ui2.user_id != target_user_id
      AND ui1.interaction_type IN ('attend', 'like')
      AND ui2.interaction_type IN ('attend', 'like')
    GROUP BY ui2.user_id
    HAVING COUNT(*) >= 2
    ORDER BY affinity_score DESC
    LIMIT 20
  ),
  recommendations AS (
    SELECT 
      e.id as event_id,
      e.title,
      e.description,
      e.location,
      e.date,
      AVG(su.affinity_score) as affinity_score,
      'Users with similar interests also liked this' as recommendation_reason
    FROM similar_users su
    JOIN user_interactions ui ON su.user_id = ui.user_id
    JOIN events e ON ui.event_id = e.id
    WHERE 
      e.status = 'approved'
      AND e.date >= CURRENT_DATE
      AND ui.interaction_type IN ('attend', 'like')
      AND NOT EXISTS (
        SELECT 1 FROM user_interactions ui2 
        WHERE ui2.user_id = target_user_id 
        AND ui2.event_id = e.id
      )
    GROUP BY e.id, e.title, e.description, e.location, e.date
  )
  SELECT 
    r.event_id,
    r.title,
    r.description,
    r.location,
    r.date,
    r.affinity_score,
    r.recommendation_reason
  FROM recommendations r
  ORDER BY r.affinity_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================
-- SEARCH ANALYTICS FUNCTIONS
-- ===================================

-- Track search query
CREATE OR REPLACE FUNCTION track_search(
  user_id_param uuid,
  query_param text,
  filters_param jsonb DEFAULT '{}',
  results_count_param integer DEFAULT 0,
  search_type_param varchar(50) DEFAULT 'events'
)
RETURNS uuid AS $$
DECLARE
  search_id uuid;
BEGIN
  -- Insert search history
  INSERT INTO search_history (user_id, query, filters, results_count, search_type)
  VALUES (user_id_param, query_param, filters_param, results_count_param, search_type_param)
  RETURNING id INTO search_id;
  
  -- Update search analytics
  INSERT INTO search_analytics (query, results_count, search_count)
  VALUES (query_param, results_count_param, 1)
  ON CONFLICT (query) DO UPDATE SET
    results_count = (search_analytics.results_count + EXCLUDED.results_count) / 2,
    search_count = search_analytics.search_count + 1,
    last_searched = now();
  
  RETURN search_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Track search result click
CREATE OR REPLACE FUNCTION track_search_click(
  search_id_param uuid,
  clicked_result_id_param uuid
)
RETURNS void AS $$
BEGIN
  -- Update search history with clicked result
  UPDATE search_history 
  SET clicked_result_id = clicked_result_id_param
  WHERE id = search_id_param;
  
  -- Update click-through rate in analytics
  UPDATE search_analytics
  SET click_through_rate = (
    SELECT 
      (COUNT(*) FILTER (WHERE clicked_result_id IS NOT NULL)::numeric / COUNT(*)) * 100
    FROM search_history 
    WHERE query = (SELECT query FROM search_history WHERE id = search_id_param)
  )
  WHERE query = (SELECT query FROM search_history WHERE id = search_id_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
