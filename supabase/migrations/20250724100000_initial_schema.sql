-- RaveTracker v3.0 - Initial Database Schema
-- ============================================
-- Complete schema with all tables, constraints, and indexes

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS event_images CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS event_attendance CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS event_categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop existing types if they exist
DROP TYPE IF EXISTS event_status CASCADE;
DROP TYPE IF EXISTS attendance_status CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;

-- Create custom types
CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled', 'postponed', 'completed');
CREATE TYPE attendance_status AS ENUM ('interested', 'going', 'not_going', 'maybe');
CREATE TYPE notification_type AS ENUM ('event_reminder', 'event_update', 'new_event', 'system', 'social');

-- =====================================================
-- PROFILES TABLE
-- =====================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Personal Information
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    username VARCHAR(30) UNIQUE,
    bio TEXT,
    avatar_url TEXT,
    birth_date DATE,
    
    -- Preferences
    favorite_genres TEXT[] DEFAULT '{}',
    location_city VARCHAR(100),
    location_country VARCHAR(100),
    
    -- Social Links
    social_links JSONB DEFAULT '{}',
    
    -- User Status
    is_organizer BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_private BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT profiles_username_length CHECK (char_length(username) >= 3),
    CONSTRAINT profiles_first_name_length CHECK (char_length(first_name) >= 1),
    CONSTRAINT profiles_birth_date_valid CHECK (birth_date <= CURRENT_DATE - INTERVAL '13 years')
);

-- Indexes for profiles
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_location ON profiles(location_city, location_country);
CREATE INDEX idx_profiles_is_organizer ON profiles(is_organizer) WHERE is_organizer = TRUE;
CREATE INDEX idx_profiles_favorite_genres ON profiles USING GIN(favorite_genres);

-- =====================================================
-- EVENT CATEGORIES TABLE
-- =====================================================
CREATE TABLE event_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Category Information
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50), -- Icon name/identifier
    color VARCHAR(7), -- Hex color code
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT event_categories_name_length CHECK (char_length(name) >= 2),
    CONSTRAINT event_categories_color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Indexes for event_categories
CREATE INDEX idx_event_categories_name ON event_categories(name);
CREATE INDEX idx_event_categories_active ON event_categories(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_event_categories_sort ON event_categories(sort_order);

-- =====================================================
-- EVENTS TABLE
-- =====================================================
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Information
    title VARCHAR(200) NOT NULL,
    description TEXT,
    slug VARCHAR(250) UNIQUE,
    
    -- Date and Time
    date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Location
    location_name VARCHAR(200),
    location_address TEXT,
    location_city VARCHAR(100),
    location_country VARCHAR(100),
    location_coordinates POINT, -- PostGIS point for lat/lng
    venue_type VARCHAR(50), -- 'indoor', 'outdoor', 'online', 'hybrid'
    
    -- Event Details
    price_min DECIMAL(10,2) DEFAULT 0.00,
    price_max DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'EUR',
    capacity INTEGER,
    age_restriction INTEGER,
    
    -- Content
    genres TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    lineup TEXT[], -- Artist names
    
    -- Relations
    organizer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES event_categories(id) ON DELETE SET NULL,
    
    -- Status
    status event_status DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT FALSE,
    is_private BOOLEAN DEFAULT FALSE,
    
    -- Engagement
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    
    -- External Links
    ticket_url TEXT,
    website_url TEXT,
    social_links JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT events_title_length CHECK (char_length(title) >= 3),
    CONSTRAINT events_capacity_positive CHECK (capacity > 0),
    CONSTRAINT events_price_valid CHECK (price_min >= 0 AND (price_max IS NULL OR price_max >= price_min)),
    CONSTRAINT events_age_restriction_valid CHECK (age_restriction >= 0 AND age_restriction <= 99),
    CONSTRAINT events_end_time_valid CHECK (end_time IS NULL OR end_time > date_time),
    CONSTRAINT events_currency_format CHECK (char_length(currency) = 3)
);

-- Indexes for events
CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_events_category_id ON events(category_id);
CREATE INDEX idx_events_date_time ON events(date_time);
CREATE INDEX idx_events_location ON events(location_city, location_country);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_published ON events(published_at) WHERE status = 'published';
CREATE INDEX idx_events_featured ON events(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_events_genres ON events USING GIN(genres);
CREATE INDEX idx_events_tags ON events USING GIN(tags);
CREATE INDEX idx_events_lineup ON events USING GIN(lineup);
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_coordinates ON events USING GIST(location_coordinates);

-- Full-text search index using individual fields (more reliable)
CREATE INDEX idx_events_title_search ON events USING GIN(to_tsvector('english', coalesce(title, '')));
CREATE INDEX idx_events_description_search ON events USING GIN(to_tsvector('english', coalesce(description, '')));
CREATE INDEX idx_events_location_search ON events USING GIN(to_tsvector('english', coalesce(location_name, '')));

-- =====================================================
-- EVENT ATTENDANCE TABLE
-- =====================================================
CREATE TABLE event_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relations
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    
    -- Attendance Status
    status attendance_status NOT NULL DEFAULT 'interested',
    
    -- Additional Information
    notes TEXT,
    notification_enabled BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, event_id)
);

-- Indexes for event_attendance
CREATE INDEX idx_event_attendance_user_id ON event_attendance(user_id);
CREATE INDEX idx_event_attendance_event_id ON event_attendance(event_id);
CREATE INDEX idx_event_attendance_status ON event_attendance(status);
CREATE INDEX idx_event_attendance_created ON event_attendance(created_at);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relations
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    
    -- Notification Content
    title VARCHAR(200) NOT NULL,
    message TEXT,
    type notification_type NOT NULL DEFAULT 'system',
    
    -- Status
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Delivery
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    data JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT notifications_title_length CHECK (char_length(title) >= 1)
);

-- Indexes for notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_event_id ON notifications(event_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(read, user_id);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- =====================================================
-- EVENT IMAGES TABLE
-- =====================================================
CREATE TABLE event_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relations
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    
    -- Image Information
    url TEXT NOT NULL,
    alt_text VARCHAR(200),
    caption TEXT,
    
    -- Image Properties
    width INTEGER,
    height INTEGER,
    file_size INTEGER, -- in bytes
    mime_type VARCHAR(50),
    
    -- Status
    is_primary BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT TRUE,
    
    -- Storage
    storage_path TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT event_images_url_length CHECK (char_length(url) >= 10),
    CONSTRAINT event_images_dimensions_positive CHECK (
        (width IS NULL OR width > 0) AND 
        (height IS NULL OR height > 0)
    ),
    CONSTRAINT event_images_file_size_positive CHECK (file_size IS NULL OR file_size > 0)
);

-- Indexes for event_images
CREATE INDEX idx_event_images_event_id ON event_images(event_id);
CREATE INDEX idx_event_images_primary ON event_images(event_id, is_primary) WHERE is_primary = TRUE;
CREATE INDEX idx_event_images_approved ON event_images(is_approved) WHERE is_approved = TRUE;

-- =====================================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- =====================================================

-- Composite indexes for common queries
CREATE INDEX idx_events_organizer_status ON events(organizer_id, status);
CREATE INDEX idx_events_category_date ON events(category_id, date_time);
CREATE INDEX idx_events_location_date ON events(location_city, location_country, date_time);
CREATE INDEX idx_attendance_event_status ON event_attendance(event_id, status);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_categories_updated_at 
    BEFORE UPDATE ON event_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at 
    BEFORE UPDATE ON events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_attendance_updated_at 
    BEFORE UPDATE ON event_attendance 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_images_updated_at 
    BEFORE UPDATE ON event_images 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- =====================================================

-- Function to generate event slug
CREATE OR REPLACE FUNCTION generate_event_slug(event_title TEXT, event_date TIMESTAMP WITH TIME ZONE)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Create base slug from title and date
    base_slug := lower(
        regexp_replace(
            regexp_replace(event_title, '[^a-zA-Z0-9\s-]', '', 'g'),
            '\s+', '-', 'g'
        )
    ) || '-' || to_char(event_date, 'YYYY-MM-DD');
    
    final_slug := base_slug;
    
    -- Ensure uniqueness
    WHILE EXISTS(SELECT 1 FROM events WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate slug
CREATE OR REPLACE FUNCTION set_event_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_event_slug(NEW.title, NEW.date_time);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_event_slug_trigger
    BEFORE INSERT OR UPDATE ON events
    FOR EACH ROW
    WHEN (NEW.slug IS NULL OR NEW.slug = '')
    EXECUTE FUNCTION set_event_slug();

-- Function to update event engagement counts
CREATE OR REPLACE FUNCTION update_event_engagement()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment count based on status
        IF NEW.status = 'going' THEN
            UPDATE events SET like_count = like_count + 1 WHERE id = NEW.event_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle status changes
        IF OLD.status != NEW.status THEN
            IF OLD.status = 'going' THEN
                UPDATE events SET like_count = like_count - 1 WHERE id = NEW.event_id;
            END IF;
            IF NEW.status = 'going' THEN
                UPDATE events SET like_count = like_count + 1 WHERE id = NEW.event_id;
            END IF;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.status = 'going' THEN
            UPDATE events SET like_count = like_count - 1 WHERE id = OLD.event_id;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_event_engagement_trigger
    AFTER INSERT OR UPDATE OR DELETE ON event_attendance
    FOR EACH ROW EXECUTE FUNCTION update_event_engagement();

-- Function to set published_at when status changes to published
CREATE OR REPLACE FUNCTION set_published_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
        NEW.published_at := NOW();
    ELSIF NEW.status != 'published' THEN
        NEW.published_at := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_published_at_trigger
    BEFORE INSERT OR UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION set_published_at();

-- Function to ensure only one primary image per event
CREATE OR REPLACE FUNCTION ensure_single_primary_image()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = TRUE THEN
        -- Remove primary flag from other images of the same event
        UPDATE event_images 
        SET is_primary = FALSE 
        WHERE event_id = NEW.event_id AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_primary_image_trigger
    BEFORE INSERT OR UPDATE ON event_images
    FOR EACH ROW
    WHEN (NEW.is_primary = TRUE)
    EXECUTE FUNCTION ensure_single_primary_image();

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE profiles IS 'User profiles with personal information and preferences';
COMMENT ON TABLE event_categories IS 'Categories for organizing events';
COMMENT ON TABLE events IS 'Main events table with all event information';
COMMENT ON TABLE event_attendance IS 'User attendance status for events';
COMMENT ON TABLE notifications IS 'User notifications and reminders';
COMMENT ON TABLE event_images IS 'Images associated with events';

-- Column comments for important fields
COMMENT ON COLUMN events.slug IS 'URL-friendly identifier for events';
COMMENT ON COLUMN events.location_coordinates IS 'PostGIS point for geographical queries';
COMMENT ON COLUMN events.venue_type IS 'Type of venue: indoor, outdoor, online, hybrid';
COMMENT ON COLUMN profiles.social_links IS 'JSON object with social media links';
COMMENT ON COLUMN events.social_links IS 'JSON object with event-related social links';
COMMENT ON COLUMN notifications.data IS 'Additional notification metadata as JSON';
