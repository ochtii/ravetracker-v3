-- Search & Discovery System Setup
-- ===================================
-- Full-text search, geolocation, and recommendation engine

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- Trigram matching for fuzzy search
CREATE EXTENSION IF NOT EXISTS "unaccent";       -- Remove accents for better search
CREATE EXTENSION IF NOT EXISTS "postgis";        -- Geospatial queries
CREATE EXTENSION IF NOT EXISTS "fuzzystrmatch";  -- Fuzzy string matching

-- ===================================
-- SEARCH VECTORS & INDEXES
-- ===================================

-- Add search vectors to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS search_vector tsvector,
ADD COLUMN IF NOT EXISTS location_point geometry(POINT, 4326),
ADD COLUMN IF NOT EXISTS search_tags text[],
ADD COLUMN IF NOT EXISTS popularity_score integer DEFAULT 0;

-- Add search vectors to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS search_vector tsvector,
ADD COLUMN IF NOT EXISTS search_preferences jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS search_history jsonb DEFAULT '[]';

-- Update search vectors for events
UPDATE events SET search_vector = 
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(location, '')), 'C') ||
  setweight(to_tsvector('english', coalesce(array_to_string(search_tags, ' '), '')), 'D');

-- Update search vectors for profiles
UPDATE profiles SET search_vector = 
  setweight(to_tsvector('english', coalesce(username, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(bio, '')), 'B');

-- ===================================
-- SEARCH INDEXES
-- ===================================

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_events_search_vector ON events USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_profiles_search_vector ON profiles USING gin(search_vector);

-- Trigram indexes for autocomplete
CREATE INDEX IF NOT EXISTS idx_events_title_trgm ON events USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_events_location_trgm ON events USING gin(location gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_username_trgm ON profiles USING gin(username gin_trgm_ops);

-- Geospatial indexes
CREATE INDEX IF NOT EXISTS idx_events_location_point ON events USING gist(location_point);

-- Search optimization indexes
CREATE INDEX IF NOT EXISTS idx_events_popularity ON events(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_events_date_popularity ON events(date, popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_events_tags ON events USING gin(search_tags);

-- ===================================
-- SEARCH HISTORY TABLE
-- ===================================

CREATE TABLE IF NOT EXISTS search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  query text NOT NULL,
  filters jsonb DEFAULT '{}',
  results_count integer DEFAULT 0,
  clicked_result_id uuid,
  search_type varchar(50) DEFAULT 'events', -- 'events', 'users', 'locations'
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_query ON search_history USING gin(query gin_trgm_ops);

-- ===================================
-- SEARCH ANALYTICS TABLE
-- ===================================

CREATE TABLE IF NOT EXISTS search_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  results_count integer DEFAULT 0,
  click_through_rate decimal(5,2) DEFAULT 0,
  search_count integer DEFAULT 1,
  last_searched timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics(query);

-- ===================================
-- RECOMMENDATION TABLES
-- ===================================

-- User interaction tracking
CREATE TABLE IF NOT EXISTS user_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  interaction_type varchar(50) NOT NULL, -- 'view', 'attend', 'like', 'share'
  interaction_weight decimal(3,2) DEFAULT 1.0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_interactions_user ON user_interactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_interactions_event ON user_interactions(event_id, interaction_type);

-- Event similarity matrix
CREATE TABLE IF NOT EXISTS event_similarities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_a_id uuid REFERENCES events(id) ON DELETE CASCADE,
  event_b_id uuid REFERENCES events(id) ON DELETE CASCADE,
  similarity_score decimal(5,4) NOT NULL,
  similarity_type varchar(50) DEFAULT 'content', -- 'content', 'collaborative', 'location'
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_a_id, event_b_id, similarity_type)
);

CREATE INDEX IF NOT EXISTS idx_event_similarities_a ON event_similarities(event_a_id, similarity_score DESC);
CREATE INDEX IF NOT EXISTS idx_event_similarities_b ON event_similarities(event_b_id, similarity_score DESC);

-- ===================================
-- TRIGGERS FOR SEARCH VECTOR UPDATES
-- ===================================

-- Function to update event search vector
CREATE OR REPLACE FUNCTION update_event_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.location, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.search_tags, ' '), '')), 'D');
  
  -- Update location point if coordinates provided
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location_point := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update profile search vector
CREATE OR REPLACE FUNCTION update_profile_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', coalesce(NEW.username, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.bio, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS update_events_search_vector ON events;
CREATE TRIGGER update_events_search_vector
  BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_event_search_vector();

DROP TRIGGER IF EXISTS update_profiles_search_vector ON profiles;
CREATE TRIGGER update_profiles_search_vector
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_profile_search_vector();

-- ===================================
-- RLS POLICIES FOR SEARCH TABLES
-- ===================================

-- Search history policies
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own search history" ON search_history
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can access all search history" ON search_history
FOR SELECT TO authenticated
USING (is_admin());

-- User interactions policies
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own interactions" ON user_interactions
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Public read for recommendations" ON user_interactions
FOR SELECT TO authenticated
USING (true);

-- Event similarities (public read for recommendations)
ALTER TABLE event_similarities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read event similarities" ON event_similarities
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins manage event similarities" ON event_similarities
FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Search analytics (admin only)
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage search analytics" ON search_analytics
FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());
