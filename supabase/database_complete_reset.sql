-- ⚠️ WARNUNG: KOMPLETTER DATENBANK RESET - ALLE DATEN WERDEN GELÖSCHT! ⚠️
-- RaveTracker v3.0 - Komplette Datenbank Neuinitialisierung
-- =============================================================

-- 1. ALLE SCHEMAS UND DATEN LÖSCHEN
DROP SCHEMA IF EXISTS public CASCADE;

-- Schemas neu erstellen
CREATE SCHEMA public;

-- 2. EXTENSIONS AKTIVIEREN
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA extensions;

-- 3. ENUMS DEFINIEREN
CREATE TYPE verification_level AS ENUM ('basic', 'verified', 'trusted', 'moderator', 'admin');
CREATE TYPE user_role AS ENUM ('user', 'organizer', 'moderator','admin');
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'banned');
CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');
CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'rejected', 'flagged');

-- 4. AUTH SCHEMA SETUP (Supabase kompatibel)
CREATE TABLE auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID,
    email VARCHAR(255) UNIQUE,
    encrypted_password VARCHAR(255),
    email_confirmed_at TIMESTAMPTZ,
    invited_at TIMESTAMPTZ,
    confirmation_token VARCHAR(255),
    confirmation_sent_at TIMESTAMPTZ,
    recovery_token VARCHAR(255),
    recovery_sent_at TIMESTAMPTZ,
    email_change_token_new VARCHAR(255),
    email_change VARCHAR(255),
    email_change_sent_at TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ,
    raw_app_meta_data JSONB DEFAULT '{}',
    raw_user_meta_data JSONB DEFAULT '{}',
    is_super_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    phone VARCHAR(15),
    phone_confirmed_at TIMESTAMPTZ,
    phone_change VARCHAR(15),
    phone_change_token VARCHAR(255),
    phone_change_sent_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    email_change_token_current VARCHAR(255),
    email_change_confirm_status SMALLINT DEFAULT 0,
    banned_until TIMESTAMPTZ,
    reauthentication_token VARCHAR(255),
    reauthentication_sent_at TIMESTAMPTZ,
    is_sso_user BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    role VARCHAR(255) DEFAULT 'authenticated',
    aud VARCHAR(255) DEFAULT 'authenticated'
);

-- 5. PROFILES TABELLE (Haupttabelle für Benutzer)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(150),
    bio TEXT,
    avatar_url TEXT,
    birth_date DATE,
    role user_role DEFAULT 'user',
    status user_status DEFAULT 'active',
    is_organizer BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_private BOOLEAN DEFAULT FALSE,
    last_sign_in_at TIMESTAMPTZ,
    email_confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    invite_credits INTEGER DEFAULT 0,
    verification_level verification_level DEFAULT 'basic',
    social_links JSONB DEFAULT '{}'
);

-- 6. EVENT CATEGORIES
CREATE TABLE event_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6366f1',
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. EVENTS TABELLE
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    organizer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES event_categories(id),
    status event_status DEFAULT 'draft',
    moderation_status moderation_status DEFAULT 'pending',
    is_private BOOLEAN DEFAULT FALSE,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    location_name VARCHAR(255),
    location_address TEXT,
    location_coordinates POINT,
    max_attendees INTEGER,
    current_attendees INTEGER DEFAULT 0,
    price DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'EUR',
    image_url TEXT,
    external_links JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    moderation_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. EVENT ATTENDANCE
CREATE TABLE event_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'attending',
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    checked_in_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    UNIQUE(event_id, user_id)
);

-- 9. INVITE SYSTEM TABELLEN
CREATE TABLE invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(6) UNIQUE NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    used_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invite_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT single_settings_row CHECK (id = 1)
);

CREATE TABLE invite_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address INET NOT NULL,
    code_attempted VARCHAR(6) NOT NULL,
    success BOOLEAN DEFAULT FALSE,
    attempted_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    request_type verification_level NOT NULL,
    current_level verification_level NOT NULL,
    requested_level verification_level NOT NULL,
    reason TEXT,
    documents JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'pending',
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    read_at TIMESTAMPTZ,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. EVENT IMAGES
CREATE TABLE event_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    upload_order INTEGER DEFAULT 0,
    uploaded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. SYSTEM SETTINGS
CREATE TABLE system_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id),
    CONSTRAINT single_settings_row CHECK (id = 1)
);

-- 13. SECURITY UND AUDIT TABELLEN
CREATE TABLE security_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT TRUE,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. INDIZES FÜR PERFORMANCE
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_invites_code ON invites(code);
CREATE INDEX idx_invites_created_by ON invites(created_by);
CREATE INDEX idx_event_attendance_event_id ON event_attendance(event_id);
CREATE INDEX idx_event_attendance_user_id ON event_attendance(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- 15. RLS (ROW LEVEL SECURITY) AKTIVIEREN
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 16. GRUNDLEGENDE RLS POLICIES
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Public profiles are viewable" ON profiles FOR SELECT USING (NOT is_private);

-- 17. TRIGGERS FÜR AUTOMATISCHE PROFILE ERSTELLUNG
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (user_id, email, username, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
    );
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 18. VORDEFINIERTEN DATEN EINFÜGEN

-- Event Categories
INSERT INTO event_categories (id, name, description, color, icon) VALUES
('cat-techno-001', 'Techno', 'Electronic Dance Music Events', '#ff6b6b', 'music'),
('cat-house-002', 'House', 'House Music Events', '#4ecdc4', 'home'),
('cat-trance-003', 'Trance', 'Trance Music Events', '#45b7d1', 'zap'),
('cat-dnb-004', 'Drum & Bass', 'Drum and Bass Events', '#96ceb4', 'activity'),
('cat-festival-005', 'Festival', 'Music Festivals', '#feca57', 'calendar'),
('cat-club-006', 'Club', 'Club Events', '#ff9ff3', 'users');

-- Invite Settings
INSERT INTO invite_settings (setting_key, setting_value, description) VALUES
('max_attempts_per_ip', '5', 'Maximum invite code attempts per IP per hour'),
('code_expiry_hours', '168', 'Default invite code expiry in hours (7 days)'),
('rate_limit_window', '3600', 'Rate limiting window in seconds'),
('default_invite_credits', '2', 'Default invite credits for new users'),
('require_invite_codes', 'true', 'Whether invite codes are required for registration');

-- System Settings
INSERT INTO system_settings (settings) VALUES (
'{
    "site_name": "RaveTracker v3",
    "site_description": "The ultimate platform for electronic music events",
    "registration_enabled": true,
    "invite_system_enabled": true,
    "email_verification_required": true,
    "max_file_upload_size": 5242880,
    "supported_image_formats": ["jpg", "jpeg", "png", "webp"],
    "event_moderation_enabled": true,
    "auto_approve_verified_organizers": true
}'
);

-- 19. TEST BENUTZER ERSTELLEN (SICHERE PASSWÖRTER)

-- 1. ADMIN USER
INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at, confirmed_at,
    raw_user_meta_data, role, aud, created_at, updated_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'admin@ravetracker.com',
    crypt('AdminSecure2025!', gen_salt('bf')),
    NOW(), NOW(),
    '{"role": "admin", "first_name": "System", "last_name": "Administrator"}',
    'authenticated', 'authenticated', NOW(), NOW()
);

INSERT INTO profiles (
    id, user_id, email, username, first_name, last_name, display_name,
    role, status, is_organizer, is_verified, invite_credits, verification_level
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'admin@ravetracker.com', 'admin', 'System', 'Administrator', 'System Administrator',
    'admin', 'active', TRUE, TRUE, 100, 'admin'
);

-- 2. MODERATOR USER
INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at, confirmed_at,
    raw_user_meta_data, role, aud, created_at, updated_at
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    'moderator@ravetracker.com',
    crypt('ModSecure2025!', gen_salt('bf')),
    NOW(), NOW(),
    '{"role": "moderator", "first_name": "Content", "last_name": "Moderator"}',
    'authenticated', 'authenticated', NOW(), NOW()
);

INSERT INTO profiles (
    id, user_id, email, username, first_name, last_name, display_name,
    role, status, is_organizer, is_verified, invite_credits, verification_level
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    'moderator@ravetracker.com', 'moderator', 'Content', 'Moderator', 'Content Moderator',
    'moderator', 'active', FALSE, TRUE, 25, 'moderator'
);

-- 3. ORGANIZER USER
INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at, confirmed_at,
    raw_user_meta_data, role, aud, created_at, updated_at
) VALUES (
    '33333333-3333-3333-3333-333333333333',
    'organizer@ravetracker.com',
    crypt('OrgSecure2025!', gen_salt('bf')),
    NOW(), NOW(),
    '{"role": "organizer", "first_name": "Event", "last_name": "Organizer"}',
    'authenticated', 'authenticated', NOW(), NOW()
);

INSERT INTO profiles (
    id, user_id, email, username, first_name, last_name, display_name,
    role, status, is_organizer, is_verified, invite_credits, verification_level
) VALUES (
    '33333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    'organizer@ravetracker.com', 'organizer', 'Event', 'Organizer', 'Event Organizer',
    'organizer', 'active', TRUE, TRUE, 50, 'trusted'
);

-- 4. REGULAR USER
INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at, confirmed_at,
    raw_user_meta_data, role, aud, created_at, updated_at
) VALUES (
    '44444444-4444-4444-4444-444444444444',
    'user@ravetracker.com',
    crypt('UserSecure2025!', gen_salt('bf')),
    NOW(), NOW(),
    '{"role": "user", "first_name": "Test", "last_name": "User"}',
    'authenticated', 'authenticated', NOW(), NOW()
);

INSERT INTO profiles (
    id, user_id, email, username, first_name, last_name, display_name,
    role, status, is_organizer, is_verified, invite_credits, verification_level
) VALUES (
    '44444444-4444-4444-4444-444444444444',
    '44444444-4444-4444-4444-444444444444',
    'user@ravetracker.com', 'testuser', 'Test', 'User', 'Test User',
    'user', 'active', FALSE, TRUE, 5, 'verified'
);

-- 20. BEISPIEL INVITE CODES ERSTELLEN
INSERT INTO invites (code, created_by, expires_at, metadata) VALUES
('ADMIN1', '11111111-1111-1111-1111-111111111111', NOW() + INTERVAL '30 days', '{"created_by_role": "admin"}'),
('WELCOM', '33333333-3333-3333-3333-333333333333', NOW() + INTERVAL '7 days', '{"created_by_role": "organizer"}'),
('INVITE', '22222222-2222-2222-2222-222222222222', NOW() + INTERVAL '14 days', '{"created_by_role": "moderator"}'),
('PARTY1', '33333333-3333-3333-3333-333333333333', NOW() + INTERVAL '7 days', '{"event_specific": true}'),
('SECURE', '11111111-1111-1111-1111-111111111111', NOW() + INTERVAL '30 days', '{"high_security": true}');

-- 21. BEISPIEL EVENT ERSTELLEN
INSERT INTO events (
    id, title, description, organizer_id, category_id, status, moderation_status,
    start_date, end_date, location_name, location_address, max_attendees, price
) VALUES (
    'event-demo-001',
    'Welcome to RaveTracker Demo Event',
    'Dies ist ein Demo-Event um das System zu testen. Hier werden alle Features der Plattform demonstriert.',
    '33333333-3333-3333-3333-333333333333',
    'cat-techno-001',
    'published',
    'approved',
    NOW() + INTERVAL '7 days',
    NOW() + INTERVAL '7 days' + INTERVAL '6 hours',
    'Demo Venue',
    'Musterstraße 123, 12345 Musterstadt',
    500,
    25.00
);

-- 22. BESTÄTIGUNG UND STATISTIKEN

-- Benutzer Übersicht
SELECT 'BENUTZER ERSTELLT:' as status;
SELECT 
    p.username,
    p.email,
    p.role,
    p.verification_level,
    p.invite_credits,
    p.is_organizer,
    p.is_verified,
    u.email_confirmed_at IS NOT NULL as email_confirmed
FROM profiles p
JOIN auth.users u ON p.user_id = u.id
ORDER BY 
    CASE p.role 
        WHEN 'admin' THEN 1
        WHEN 'moderator' THEN 2
        WHEN 'organizer' THEN 3
        WHEN 'user' THEN 4
    END;

-- Event Categories
SELECT 'EVENT KATEGORIEN:' as status;
SELECT name, description, color, icon FROM event_categories ORDER BY name;

-- Aktive Invite Codes
SELECT 'AKTIVE INVITE CODES:' as status;
SELECT 
    i.code,
    p.username as erstellt_von,
    i.expires_at,
    i.is_active,
    i.max_uses,
    i.current_uses
FROM invites i
JOIN profiles p ON i.created_by = p.id
WHERE i.is_active = TRUE AND i.expires_at > NOW()
ORDER BY i.expires_at;

-- Demo Event
SELECT 'DEMO EVENT:' as status;
SELECT 
    e.title,
    e.status,
    e.moderation_status,
    p.username as organizer,
    e.start_date,
    e.max_attendees,
    e.price
FROM events e
JOIN profiles p ON e.organizer_id = p.id;

-- Statistiken
SELECT 'SYSTEM STATISTIKEN:' as status;
SELECT 
    (SELECT COUNT(*) FROM profiles) as total_users,
    (SELECT COUNT(*) FROM profiles WHERE role = 'admin') as admins,
    (SELECT COUNT(*) FROM profiles WHERE role = 'moderator') as moderators,
    (SELECT COUNT(*) FROM profiles WHERE role = 'organizer') as organizers,
    (SELECT COUNT(*) FROM profiles WHERE role = 'user') as users,
    (SELECT COUNT(*) FROM events) as total_events,
    (SELECT COUNT(*) FROM invites WHERE is_active = TRUE) as active_invites,
    (SELECT COUNT(*) FROM event_categories) as categories;

-- FERTIG!
SELECT '🎉 DATENBANK ERFOLGREICH ZURÜCKGESETZT UND INITIALISIERT! 🎉' as status;

-- =============================================================
-- LOGIN DATEN FÜR TEST BENUTZER:
-- =============================================================
-- 👑 Admin:     admin@ravetracker.com     / AdminSecure2025!
-- 🛡️ Moderator: moderator@ravetracker.com / ModSecure2025!
-- 🎪 Organizer: organizer@ravetracker.com / OrgSecure2025!
-- 👤 User:      user@ravetracker.com      / UserSecure2025!
-- =============================================================
-- 🎫 Invite Codes: ADMIN1, WELCOM, INVITE, PARTY1, SECURE
-- =============================================================
