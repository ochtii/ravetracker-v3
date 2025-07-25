-- ⚠️ SUPABASE-KOMPATIBLE VERSION: Sicher für Cloud-Supabase
-- RaveTracker v3.0 - Datenbank Reset ohne auth.users Manipulation
-- =============================================================

-- 1. NUR PUBLIC SCHEMA TABELLEN LÖSCHEN (nicht auth Schema!)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS event_attendance CASCADE;
DROP TABLE IF EXISTS event_images CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS event_categories CASCADE;
DROP TABLE IF EXISTS verification_requests CASCADE;
DROP TABLE IF EXISTS invite_attempts CASCADE;
DROP TABLE IF EXISTS invite_settings CASCADE;
DROP TABLE IF EXISTS invites CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS security_audit CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;

-- Eigene Funktionen löschen
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Eigene Typen löschen
DROP TYPE IF EXISTS verification_level CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS event_status CASCADE;
DROP TYPE IF EXISTS moderation_status CASCADE;

-- 2. EXTENSIONS SICHERSTELLEN
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 3. ENUMS DEFINIEREN
CREATE TYPE verification_level AS ENUM ('basic', 'verified', 'trusted', 'moderator', 'admin');
CREATE TYPE user_role AS ENUM ('user', 'organizer', 'moderator','admin');
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'banned');
CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');
CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'rejected', 'flagged');

-- 4. PROFILES TABELLE (Haupttabelle für Benutzer)
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

-- 5. EVENT CATEGORIES
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

-- 6. EVENTS TABELLE
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

-- 7. EVENT ATTENDANCE
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

-- 8. INVITE SYSTEM TABELLEN
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
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

-- 9. NOTIFICATIONS
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

-- 10. EVENT IMAGES
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

-- 11. SYSTEM SETTINGS
CREATE TABLE system_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id),
    CONSTRAINT single_settings_row CHECK (id = 1)
);

-- 12. SECURITY UND AUDIT TABELLEN
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

-- 13. INDIZES FÜR PERFORMANCE
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

-- 14. RLS (ROW LEVEL SECURITY) AKTIVIEREN
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 15. GRUNDLEGENDE RLS POLICIES
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Public profiles are viewable" ON profiles FOR SELECT USING (NOT is_private);

-- Events: Alle können Events sehen, nur Organizer+ können Events erstellen/bearbeiten
CREATE POLICY "events_select_all" ON events FOR SELECT USING (status = 'published');
CREATE POLICY "events_insert_organizer" ON events FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM profiles WHERE role IN ('organizer', 'moderator', 'admin')));
CREATE POLICY "events_update_own" ON events FOR UPDATE USING (organizer_id = auth.uid() OR auth.uid() IN (SELECT user_id FROM profiles WHERE role IN ('moderator', 'admin')));

-- Event Categories: Alle können lesen
CREATE POLICY "event_categories_select_all" ON event_categories FOR SELECT USING (is_active = true);

-- 16. TRIGGERS FÜR AUTOMATISCHE PROFILE ERSTELLUNG
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

-- 17. VORDEFINIERTEN DATEN EINFÜGEN

-- Event Categories
INSERT INTO event_categories (name, description, color, icon) VALUES
('Techno', 'Electronic Dance Music Events', '#ff6b6b', 'music'),
('House', 'House Music Events', '#4ecdc4', 'home'),
('Trance', 'Trance Music Events', '#45b7d1', 'zap'),
('Drum & Bass', 'Drum and Bass Events', '#96ceb4', 'activity'),
('Festival', 'Music Festivals', '#feca57', 'calendar'),
('Club', 'Club Events', '#ff9ff3', 'users');

-- Invite Settings
INSERT INTO invite_settings (setting_key, setting_value, description) VALUES
('max_attempts_per_ip', '5', 'Maximum invite code attempts per IP per hour'),
('code_expiry_hours', '168', 'Default invite code expiry in hours (7 days)'),
('rate_limit_window', '3600', 'Rate limiting window in seconds'),
('default_invite_credits', '2', 'Default invite credits for new users'),
('require_invite_codes', 'true', 'Whether invite codes are required for registration');

-- 5 Beispiel Invite Codes erstellen
INSERT INTO invites (code, expires_at, max_uses, metadata) VALUES
('WELCOM', NOW() + INTERVAL '30 days', 50, '{"description": "Welcome invite for new users", "type": "general"}'),
('PARTY1', NOW() + INTERVAL '14 days', 25, '{"description": "Party invite code", "type": "event"}'),
('ADMIN1', NOW() + INTERVAL '90 days', NULL, '{"description": "Admin invite (unlimited uses)", "type": "admin"}'),
('SECURE', NOW() + INTERVAL '7 days', 10, '{"description": "Secure limited invite", "type": "limited"}'),
('RAVE25', NOW() + INTERVAL '21 days', 100, '{"description": "RaveTracker 2025 special invite", "type": "special"}');

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

-- 18. BESTÄTIGUNG
DO $$
BEGIN
    RAISE NOTICE '✅ RaveTracker v3 Datenbank erfolgreich initialisiert!';
    RAISE NOTICE '📊 Tabellen erstellt: profiles, events, event_categories, invites, etc.';
    RAISE NOTICE '🎵 Event-Kategorien: 6 Kategorien hinzugefügt';
    RAISE NOTICE '⚙️ Invite-System konfiguriert';
    RAISE NOTICE '🛡️ RLS aktiviert mit grundlegenden Policies';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 NÄCHSTE SCHRITTE:';
    RAISE NOTICE '1. Erstelle Test-Benutzer über Supabase Auth Dashboard';
    RAISE NOTICE '2. Oder verwende die Registrierung in deiner App';
    RAISE NOTICE '3. Teste deine Anwendung mit: npm run dev';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Test-Benutzer müssen über die normale Registrierung erstellt werden';
    RAISE NOTICE '   da direkte auth.users Manipulation in Cloud-Supabase eingeschränkt ist.';
END $$;

-- FERTIG!
SELECT '🎉 DATENBANK ERFOLGREICH INITIALISIERT! 🎉' as status;
SELECT 'Verwende die normale Registrierung um Test-Benutzer zu erstellen.' as hinweis;
