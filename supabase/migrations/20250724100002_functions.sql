-- RaveTracker v3.0 - Database Functions
-- ====================================
-- Custom functions for business logic and utilities

-- =====================================================
-- USER AND PROFILE FUNCTIONS
-- =====================================================

-- Function to create a profile when a user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, username, first_name, last_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to get user profile by user_id
CREATE OR REPLACE FUNCTION get_user_profile(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    username VARCHAR(30),
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    full_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    birth_date DATE,
    age INTEGER,
    favorite_genres TEXT[],
    location_city VARCHAR(100),
    location_country VARCHAR(100),
    social_links JSONB,
    is_organizer BOOLEAN,
    is_verified BOOLEAN,
    is_private BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.user_id,
        p.username,
        p.first_name,
        p.last_name,
        CONCAT(p.first_name, ' ', p.last_name) AS full_name,
        p.bio,
        p.avatar_url,
        p.birth_date,
        CASE 
            WHEN p.birth_date IS NOT NULL 
            THEN EXTRACT(YEAR FROM AGE(p.birth_date))::INTEGER
            ELSE NULL 
        END AS age,
        p.favorite_genres,
        p.location_city,
        p.location_country,
        p.social_links,
        p.is_organizer,
        p.is_verified,
        p.is_private,
        p.created_at,
        p.updated_at
    FROM profiles p
    WHERE p.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- EVENT FUNCTIONS
-- =====================================================

-- Function to search events with filters
CREATE OR REPLACE FUNCTION search_events(
    search_query TEXT DEFAULT NULL,
    category_filter UUID DEFAULT NULL,
    location_city_filter VARCHAR(100) DEFAULT NULL,
    location_country_filter VARCHAR(100) DEFAULT NULL,
    date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    genres_filter TEXT[] DEFAULT NULL,
    organizer_filter UUID DEFAULT NULL,
    status_filter event_status DEFAULT 'published',
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(200),
    description TEXT,
    slug VARCHAR(250),
    date_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    location_name VARCHAR(200),
    location_city VARCHAR(100),
    location_country VARCHAR(100),
    price_min DECIMAL(10,2),
    price_max DECIMAL(10,2),
    currency VARCHAR(3),
    capacity INTEGER,
    genres TEXT[],
    tags TEXT[],
    lineup TEXT[],
    organizer_id UUID,
    organizer_name TEXT,
    category_id UUID,
    category_name VARCHAR(50),
    status event_status,
    is_featured BOOLEAN,
    view_count INTEGER,
    like_count INTEGER,
    attendance_count BIGINT,
    primary_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.title,
        e.description,
        e.slug,
        e.date_time,
        e.end_time,
        e.location_name,
        e.location_city,
        e.location_country,
        e.price_min,
        e.price_max,
        e.currency,
        e.capacity,
        e.genres,
        e.tags,
        e.lineup,
        e.organizer_id,
        CONCAT(p.first_name, ' ', p.last_name) AS organizer_name,
        e.category_id,
        c.name AS category_name,
        e.status,
        e.is_featured,
        e.view_count,
        e.like_count,
        COALESCE(att.attendance_count, 0) AS attendance_count,
        img.url AS primary_image_url,
        e.created_at
    FROM events e
    LEFT JOIN profiles p ON e.organizer_id = p.id
    LEFT JOIN event_categories c ON e.category_id = c.id
    LEFT JOIN (
        SELECT 
            event_id, 
            COUNT(*) as attendance_count 
        FROM event_attendance 
        WHERE status IN ('going', 'interested') 
        GROUP BY event_id
    ) att ON e.id = att.event_id
    LEFT JOIN (
        SELECT DISTINCT ON (event_id) 
            event_id, 
            url 
        FROM event_images 
        WHERE is_primary = TRUE AND is_approved = TRUE
    ) img ON e.id = img.event_id
    WHERE 
        -- Status filter
        e.status = COALESCE(status_filter, e.status)
        -- Search query
        AND (
            search_query IS NULL OR
            to_tsvector('english', 
                COALESCE(e.title, '') || ' ' || 
                COALESCE(e.description, '') || ' ' || 
                COALESCE(e.location_name, '') || ' ' ||
                COALESCE(array_to_string(e.genres, ' '), '') || ' ' ||
                COALESCE(array_to_string(e.tags, ' '), '')
            ) @@ plainto_tsquery('english', search_query)
        )
        -- Category filter
        AND (category_filter IS NULL OR e.category_id = category_filter)
        -- Location filters
        AND (location_city_filter IS NULL OR e.location_city ILIKE '%' || location_city_filter || '%')
        AND (location_country_filter IS NULL OR e.location_country ILIKE '%' || location_country_filter || '%')
        -- Date range filters
        AND (date_from IS NULL OR e.date_time >= date_from)
        AND (date_to IS NULL OR e.date_time <= date_to)
        -- Genres filter (array overlap)
        AND (genres_filter IS NULL OR e.genres && genres_filter)
        -- Organizer filter
        AND (organizer_filter IS NULL OR e.organizer_id = organizer_filter)
        -- Only show public events or events user can access
        AND (
            e.is_private = FALSE OR
            EXISTS (
                SELECT 1 FROM event_attendance 
                WHERE event_id = e.id AND user_id = auth.uid()
            ) OR
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = e.organizer_id AND user_id = auth.uid()
            )
        )
    ORDER BY 
        e.is_featured DESC,
        e.date_time ASC,
        e.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get event details with all related data
CREATE OR REPLACE FUNCTION get_event_details(event_uuid UUID)
RETURNS TABLE (
    -- Event details
    id UUID,
    title VARCHAR(200),
    description TEXT,
    slug VARCHAR(250),
    date_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    timezone VARCHAR(50),
    location_name VARCHAR(200),
    location_address TEXT,
    location_city VARCHAR(100),
    location_country VARCHAR(100),
    venue_type VARCHAR(50),
    price_min DECIMAL(10,2),
    price_max DECIMAL(10,2),
    currency VARCHAR(3),
    capacity INTEGER,
    age_restriction INTEGER,
    genres TEXT[],
    tags TEXT[],
    lineup TEXT[],
    status event_status,
    is_featured BOOLEAN,
    is_private BOOLEAN,
    view_count INTEGER,
    like_count INTEGER,
    share_count INTEGER,
    ticket_url TEXT,
    website_url TEXT,
    social_links JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- Organizer details
    organizer_id UUID,
    organizer_username VARCHAR(30),
    organizer_name TEXT,
    organizer_bio TEXT,
    organizer_avatar_url TEXT,
    organizer_verified BOOLEAN,
    
    -- Category details
    category_id UUID,
    category_name VARCHAR(50),
    category_description TEXT,
    category_icon VARCHAR(50),
    category_color VARCHAR(7),
    
    -- Attendance stats
    total_attendance BIGINT,
    going_count BIGINT,
    interested_count BIGINT,
    maybe_count BIGINT,
    
    -- User's attendance status
    user_attendance_status attendance_status,
    
    -- Images
    images JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Event details
        e.id,
        e.title,
        e.description,
        e.slug,
        e.date_time,
        e.end_time,
        e.timezone,
        e.location_name,
        e.location_address,
        e.location_city,
        e.location_country,
        e.venue_type,
        e.price_min,
        e.price_max,
        e.currency,
        e.capacity,
        e.age_restriction,
        e.genres,
        e.tags,
        e.lineup,
        e.status,
        e.is_featured,
        e.is_private,
        e.view_count,
        e.like_count,
        e.share_count,
        e.ticket_url,
        e.website_url,
        e.social_links,
        e.created_at,
        e.updated_at,
        e.published_at,
        
        -- Organizer details
        e.organizer_id,
        p.username AS organizer_username,
        CONCAT(p.first_name, ' ', p.last_name) AS organizer_name,
        p.bio AS organizer_bio,
        p.avatar_url AS organizer_avatar_url,
        p.is_verified AS organizer_verified,
        
        -- Category details
        e.category_id,
        c.name AS category_name,
        c.description AS category_description,
        c.icon AS category_icon,
        c.color AS category_color,
        
        -- Attendance stats
        COALESCE(att_stats.total_attendance, 0) AS total_attendance,
        COALESCE(att_stats.going_count, 0) AS going_count,
        COALESCE(att_stats.interested_count, 0) AS interested_count,
        COALESCE(att_stats.maybe_count, 0) AS maybe_count,
        
        -- User's attendance status
        user_att.status AS user_attendance_status,
        
        -- Images as JSON array
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', img.id,
                        'url', img.url,
                        'alt_text', img.alt_text,
                        'caption', img.caption,
                        'is_primary', img.is_primary,
                        'width', img.width,
                        'height', img.height
                    ) ORDER BY img.is_primary DESC, img.created_at ASC
                )
                FROM event_images img 
                WHERE img.event_id = e.id AND img.is_approved = TRUE
            ),
            '[]'::jsonb
        ) AS images
        
    FROM events e
    LEFT JOIN profiles p ON e.organizer_id = p.id
    LEFT JOIN event_categories c ON e.category_id = c.id
    LEFT JOIN (
        SELECT 
            event_id,
            COUNT(*) as total_attendance,
            COUNT(*) FILTER (WHERE status = 'going') as going_count,
            COUNT(*) FILTER (WHERE status = 'interested') as interested_count,
            COUNT(*) FILTER (WHERE status = 'maybe') as maybe_count
        FROM event_attendance 
        GROUP BY event_id
    ) att_stats ON e.id = att_stats.event_id
    LEFT JOIN event_attendance user_att ON (
        e.id = user_att.event_id AND 
        user_att.user_id = auth.uid()
    )
    WHERE e.id = event_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment event view count
CREATE OR REPLACE FUNCTION increment_event_views(event_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE events 
    SET view_count = view_count + 1 
    WHERE id = event_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ATTENDANCE FUNCTIONS
-- =====================================================

-- Function to update or create attendance
CREATE OR REPLACE FUNCTION upsert_event_attendance(
    event_uuid UUID,
    user_uuid UUID,
    attendance_status attendance_status,
    attendance_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    attendance_id UUID;
BEGIN
    INSERT INTO event_attendance (
        event_id, 
        user_id, 
        status, 
        notes,
        notification_enabled
    )
    VALUES (
        event_uuid, 
        user_uuid, 
        attendance_status, 
        attendance_notes,
        TRUE
    )
    ON CONFLICT (user_id, event_id) 
    DO UPDATE SET 
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        updated_at = NOW()
    RETURNING id INTO attendance_id;
    
    RETURN attendance_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's event attendance
CREATE OR REPLACE FUNCTION get_user_events_attendance(
    user_uuid UUID,
    attendance_filter attendance_status DEFAULT NULL,
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    attendance_id UUID,
    event_id UUID,
    event_title VARCHAR(200),
    event_date_time TIMESTAMP WITH TIME ZONE,
    event_location_city VARCHAR(100),
    event_primary_image TEXT,
    attendance_status attendance_status,
    attendance_created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ea.id AS attendance_id,
        e.id AS event_id,
        e.title AS event_title,
        e.date_time AS event_date_time,
        e.location_city AS event_location_city,
        img.url AS event_primary_image,
        ea.status AS attendance_status,
        ea.created_at AS attendance_created_at
    FROM event_attendance ea
    JOIN events e ON ea.event_id = e.id
    LEFT JOIN (
        SELECT DISTINCT ON (event_id) 
            event_id, 
            url 
        FROM event_images 
        WHERE is_primary = TRUE AND is_approved = TRUE
    ) img ON e.id = img.event_id
    WHERE 
        ea.user_id = user_uuid
        AND (attendance_filter IS NULL OR ea.status = attendance_filter)
        AND e.status = 'published'
    ORDER BY ea.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- NOTIFICATION FUNCTIONS
-- =====================================================

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    user_uuid UUID,
    notification_title VARCHAR(200),
    notification_message TEXT,
    notification_type notification_type,
    event_uuid UUID DEFAULT NULL,
    notification_data JSONB DEFAULT '{}'::jsonb,
    schedule_for TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        event_id,
        data,
        scheduled_for
    )
    VALUES (
        user_uuid,
        notification_title,
        notification_message,
        notification_type,
        event_uuid,
        notification_data,
        schedule_for
    )
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(
    user_uuid UUID,
    notification_ids UUID[] DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    IF notification_ids IS NULL THEN
        -- Mark all unread notifications as read
        UPDATE notifications 
        SET 
            read = TRUE,
            read_at = NOW(),
            updated_at = NOW()
        WHERE 
            user_id = user_uuid 
            AND read = FALSE;
    ELSE
        -- Mark specific notifications as read
        UPDATE notifications 
        SET 
            read = TRUE,
            read_at = NOW(),
            updated_at = NOW()
        WHERE 
            user_id = user_uuid 
            AND id = ANY(notification_ids)
            AND read = FALSE;
    END IF;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user notifications
CREATE OR REPLACE FUNCTION get_user_notifications(
    user_uuid UUID,
    unread_only BOOLEAN DEFAULT FALSE,
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(200),
    message TEXT,
    type notification_type,
    read BOOLEAN,
    event_id UUID,
    event_title VARCHAR(200),
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.title,
        n.message,
        n.type,
        n.read,
        n.event_id,
        e.title AS event_title,
        n.data,
        n.created_at
    FROM notifications n
    LEFT JOIN events e ON n.event_id = e.id
    WHERE 
        n.user_id = user_uuid
        AND (NOT unread_only OR n.read = FALSE)
    ORDER BY n.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ANALYTICS AND STATISTICS FUNCTIONS
-- =====================================================

-- Function to get event statistics
CREATE OR REPLACE FUNCTION get_event_statistics(event_uuid UUID)
RETURNS TABLE (
    total_views INTEGER,
    total_likes INTEGER,
    total_shares INTEGER,
    total_attendees BIGINT,
    going_count BIGINT,
    interested_count BIGINT,
    maybe_count BIGINT,
    not_going_count BIGINT,
    demographics JSONB,
    daily_views JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH attendance_stats AS (
        SELECT 
            COUNT(*) as total_attendees,
            COUNT(*) FILTER (WHERE status = 'going') as going_count,
            COUNT(*) FILTER (WHERE status = 'interested') as interested_count,
            COUNT(*) FILTER (WHERE status = 'maybe') as maybe_count,
            COUNT(*) FILTER (WHERE status = 'not_going') as not_going_count
        FROM event_attendance 
        WHERE event_id = event_uuid
    ),
    demo_stats AS (
        SELECT jsonb_build_object(
            'age_groups', jsonb_object_agg(
                CASE 
                    WHEN EXTRACT(YEAR FROM AGE(p.birth_date)) < 18 THEN 'under_18'
                    WHEN EXTRACT(YEAR FROM AGE(p.birth_date)) < 25 THEN '18_24'
                    WHEN EXTRACT(YEAR FROM AGE(p.birth_date)) < 35 THEN '25_34'
                    WHEN EXTRACT(YEAR FROM AGE(p.birth_date)) < 45 THEN '35_44'
                    ELSE '45_plus'
                END,
                age_count
            ),
            'locations', jsonb_object_agg(
                COALESCE(p.location_city, 'Unknown'),
                location_count
            )
        ) as demographics
        FROM (
            SELECT 
                CASE 
                    WHEN EXTRACT(YEAR FROM AGE(p.birth_date)) < 18 THEN 'under_18'
                    WHEN EXTRACT(YEAR FROM AGE(p.birth_date)) < 25 THEN '18_24'
                    WHEN EXTRACT(YEAR FROM AGE(p.birth_date)) < 35 THEN '25_34'
                    WHEN EXTRACT(YEAR FROM AGE(p.birth_date)) < 45 THEN '35_44'
                    ELSE '45_plus'
                END as age_group,
                COUNT(*) as age_count
            FROM event_attendance ea
            JOIN profiles p ON ea.user_id = p.user_id
            WHERE ea.event_id = event_uuid AND ea.status IN ('going', 'interested')
            GROUP BY age_group
        ) age_data
        FULL OUTER JOIN (
            SELECT 
                COALESCE(p.location_city, 'Unknown') as location,
                COUNT(*) as location_count
            FROM event_attendance ea
            JOIN profiles p ON ea.user_id = p.user_id
            WHERE ea.event_id = event_uuid AND ea.status IN ('going', 'interested')
            GROUP BY p.location_city
        ) location_data ON true
    )
    SELECT 
        e.view_count as total_views,
        e.like_count as total_likes,
        e.share_count as total_shares,
        COALESCE(ats.total_attendees, 0) as total_attendees,
        COALESCE(ats.going_count, 0) as going_count,
        COALESCE(ats.interested_count, 0) as interested_count,
        COALESCE(ats.maybe_count, 0) as maybe_count,
        COALESCE(ats.not_going_count, 0) as not_going_count,
        COALESCE(ds.demographics, '{}'::jsonb) as demographics,
        '{}'::jsonb as daily_views -- Placeholder for view tracking by day
    FROM events e
    LEFT JOIN attendance_stats ats ON true
    LEFT JOIN demo_stats ds ON true
    WHERE e.id = event_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get organizer dashboard stats
CREATE OR REPLACE FUNCTION get_organizer_dashboard(organizer_uuid UUID)
RETURNS TABLE (
    total_events BIGINT,
    published_events BIGINT,
    draft_events BIGINT,
    upcoming_events BIGINT,
    past_events BIGINT,
    total_attendees BIGINT,
    total_views BIGINT,
    recent_events JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH event_stats AS (
        SELECT 
            COUNT(*) as total_events,
            COUNT(*) FILTER (WHERE status = 'published') as published_events,
            COUNT(*) FILTER (WHERE status = 'draft') as draft_events,
            COUNT(*) FILTER (WHERE status = 'published' AND date_time > NOW()) as upcoming_events,
            COUNT(*) FILTER (WHERE status = 'published' AND date_time <= NOW()) as past_events,
            SUM(view_count) as total_views
        FROM events e
        JOIN profiles p ON e.organizer_id = p.id
        WHERE p.user_id = organizer_uuid
    ),
    attendee_stats AS (
        SELECT COUNT(*) as total_attendees
        FROM event_attendance ea
        JOIN events e ON ea.event_id = e.id
        JOIN profiles p ON e.organizer_id = p.id
        WHERE p.user_id = organizer_uuid
        AND ea.status IN ('going', 'interested')
    ),
    recent_events_data AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', e.id,
                'title', e.title,
                'date_time', e.date_time,
                'status', e.status,
                'attendees', COALESCE(att.attendee_count, 0),
                'views', e.view_count
            ) ORDER BY e.created_at DESC
        ) as recent_events
        FROM (
            SELECT e.*, ROW_NUMBER() OVER (ORDER BY e.created_at DESC) as rn
            FROM events e
            JOIN profiles p ON e.organizer_id = p.id
            WHERE p.user_id = organizer_uuid
        ) e
        LEFT JOIN (
            SELECT 
                event_id, 
                COUNT(*) as attendee_count
            FROM event_attendance 
            WHERE status IN ('going', 'interested')
            GROUP BY event_id
        ) att ON e.id = att.event_id
        WHERE e.rn <= 5
    )
    SELECT 
        COALESCE(es.total_events, 0) as total_events,
        COALESCE(es.published_events, 0) as published_events,
        COALESCE(es.draft_events, 0) as draft_events,
        COALESCE(es.upcoming_events, 0) as upcoming_events,
        COALESCE(es.past_events, 0) as past_events,
        COALESCE(ats.total_attendees, 0) as total_attendees,
        COALESCE(es.total_views, 0) as total_views,
        COALESCE(red.recent_events, '[]'::jsonb) as recent_events
    FROM event_stats es
    LEFT JOIN attendee_stats ats ON true
    LEFT JOIN recent_events_data red ON true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to clean up old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    temp_count INTEGER;
BEGIN
    -- Delete read notifications older than 90 days
    DELETE FROM notifications 
    WHERE 
        read = TRUE 
        AND read_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Delete unread notifications older than 1 year
    DELETE FROM notifications 
    WHERE 
        read = FALSE 
        AND created_at < NOW() - INTERVAL '1 year';
    
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update event status based on date
CREATE OR REPLACE FUNCTION update_event_statuses()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Mark published events as completed if they ended more than 24 hours ago
    UPDATE events 
    SET status = 'completed'
    WHERE 
        status = 'published'
        AND (
            (end_time IS NOT NULL AND end_time < NOW() - INTERVAL '24 hours') OR
            (end_time IS NULL AND date_time < NOW() - INTERVAL '24 hours')
        );
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANTS FOR FUNCTIONS
-- =====================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
