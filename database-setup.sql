-- RaveTracker v3.0 - Database Setup Script
-- ==========================================
-- Run this script in your Supabase SQL Editor to set up the complete database schema
-- 
-- Instructions:
-- 1. Go to your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Navigate to "SQL Editor"
-- 3. Copy and paste this entire script
-- 4. Click "Run" to execute
--
-- This script will create all necessary tables, relationships, and indexes.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist (for clean setup)
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
    
    -- Contact & Location
    website TEXT,
    location VARCHAR(100),
    
    -- Preferences
    favorite_genres TEXT[] DEFAULT '{}',
    
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
    CONSTRAINT profiles_first_name_length CHECK (char_length(first_name) >= 1)
);

-- Indexes for profiles
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_location ON profiles(location);
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
    
    -- Images
    cover_image_url TEXT,
    images TEXT[] DEFAULT '{}',
    
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

-- =====================================================
-- EVENT ATTENDANCE TABLE  
-- =====================================================
CREATE TABLE event_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relations
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    
    -- Attendance Status
    status attendance_status NOT NULL DEFAULT 'interested',
    
    -- Additional Information
    notes TEXT,
    notification_enabled BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, event_id)
);

-- Indexes for event_attendance
CREATE INDEX idx_event_attendance_user_id ON event_attendance(user_id);
CREATE INDEX idx_event_attendance_event_id ON event_attendance(event_id);
CREATE INDEX idx_event_attendance_status ON event_attendance(status);
CREATE INDEX idx_event_attendance_registered ON event_attendance(registered_at);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relations
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created ON notifications(created_at);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all public profiles" ON profiles
    FOR SELECT USING (is_private = FALSE OR user_id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own profile" ON profiles
    FOR DELETE USING (user_id = auth.uid());

-- Event categories policies
CREATE POLICY "Anyone can view active event categories" ON event_categories
    FOR SELECT USING (is_active = TRUE);

-- Events policies
CREATE POLICY "Anyone can view published events" ON events
    FOR SELECT USING (status = 'published' AND is_private = FALSE);

CREATE POLICY "Users can view their own events" ON events
    FOR SELECT USING (organizer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert events for their own profile" ON events
    FOR INSERT WITH CHECK (organizer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own events" ON events
    FOR UPDATE USING (organizer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own events" ON events
    FOR DELETE USING (organizer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Event attendance policies
CREATE POLICY "Users can view their own attendance" ON event_attendance
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view attendance for their events" ON event_attendance
    FOR SELECT USING (event_id IN (
        SELECT e.id FROM events e 
        JOIN profiles p ON e.organizer_id = p.id 
        WHERE p.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own attendance" ON event_attendance
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own attendance" ON event_attendance
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own attendance" ON event_attendance
    FOR DELETE USING (user_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_categories_updated_at BEFORE UPDATE ON event_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_attendance_updated_at BEFORE UPDATE ON event_attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Insert default event categories
INSERT INTO event_categories (name, description, icon, color, sort_order) VALUES
('Techno', 'Hard electronic beats and underground vibes', 'music', '#8B5CF6', 1),
('House', 'Groovy house music and dance floors', 'home', '#06B6D4', 2),
('Trance', 'Euphoric and uplifting electronic music', 'zap', '#F59E0B', 3),
('Drum & Bass', 'Fast breakbeats and heavy bass', 'activity', '#EF4444', 4),
('Progressive', 'Long evolving tracks and deep sounds', 'trending-up', '#10B981', 5),
('Psytrance', 'Psychedelic and hypnotic rhythms', 'eye', '#8B5CF6', 6);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- This will show a success message in the Supabase SQL Editor
DO $$
BEGIN
    RAISE NOTICE '🎉 RaveTracker v3.0 Database Setup Complete!';
    RAISE NOTICE '';
    RAISE NOTICE 'Created tables:';
    RAISE NOTICE '- profiles';
    RAISE NOTICE '- event_categories (with sample data)';
    RAISE NOTICE '- events';
    RAISE NOTICE '- event_attendance';
    RAISE NOTICE '- notifications';
    RAISE NOTICE '';
    RAISE NOTICE 'All indexes, constraints, and RLS policies have been applied.';
    RAISE NOTICE 'Your RaveTracker application should now work correctly!';
END $$;
