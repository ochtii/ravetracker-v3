-- ⚠️ SICHERE VERSION: Nur eigene Tabellen löschen (nicht die Schemas)
-- RaveTracker v3.0 - Datenbank Reset (Supabase-sicher)
-- ====================================================

-- 1. EIGENE TABELLEN LÖSCHEN (aber nicht die Supabase Schemas)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS event_attendance CASCADE;
DROP TABLE IF EXISTS event_categories CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS invite_settings CASCADE;
DROP TABLE IF EXISTS invites CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Eigene Funktionen löschen
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

-- Eigene Typen löschen
DROP TYPE IF EXISTS verification_level CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS event_status CASCADE;
DROP TYPE IF EXISTS moderation_status CASCADE;

-- 2. EXTENSIONS SICHERSTELLEN (falls nicht vorhanden)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 3. ENUMS DEFINIEREN
CREATE TYPE verification_level AS ENUM ('basic', 'verified', 'trusted', 'moderator', 'admin');
CREATE TYPE user_role AS ENUM ('user', 'organizer', 'moderator', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'banned');
CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');
CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'rejected', 'flagged');

-- 4. PROFILES TABELLE
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    role user_role DEFAULT 'user',
    verification_level verification_level DEFAULT 'basic',
    status user_status DEFAULT 'active',
    location VARCHAR(255),
    birth_date DATE,
    preferences JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    social_links JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
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
    organizer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES event_categories(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    venue_name VARCHAR(255),
    venue_address TEXT,
    venue_coordinates POINT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    ticket_url TEXT,
    price_min DECIMAL(10,2),
    price_max DECIMAL(10,2),
    age_limit INTEGER,
    capacity INTEGER,
    tags TEXT[],
    images TEXT[],
    status event_status DEFAULT 'draft',
    moderation_status moderation_status DEFAULT 'pending',
    featured BOOLEAN DEFAULT FALSE,
    external_id VARCHAR(255),
    source VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. EVENT ATTENDANCE
CREATE TABLE event_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'interested',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- 8. INVITES TABELLE
CREATE TABLE invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    created_by UUID REFERENCES profiles(id),
    max_uses INTEGER,
    uses_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. INVITE SETTINGS
CREATE TABLE invite_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    metadata JSONB DEFAULT '{}',
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. FUNKTIONEN
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. TRIGGER FÜR UPDATED_AT
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER event_categories_updated_at BEFORE UPDATE ON event_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER invite_settings_updated_at BEFORE UPDATE ON invite_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 13. RLS AKTIVIEREN
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 14. RLS POLICIES (Grundlegende Policies)
-- Profiles: Jeder kann sein eigenes Profil sehen und bearbeiten
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Events: Alle können Events sehen, nur Organizer+ können Events erstellen/bearbeiten
CREATE POLICY "events_select_all" ON events FOR SELECT USING (status = 'published');
CREATE POLICY "events_insert_organizer" ON events FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('organizer', 'moderator', 'admin')));
CREATE POLICY "events_update_own" ON events FOR UPDATE USING (organizer_id = auth.uid() OR auth.uid() IN (SELECT id FROM profiles WHERE role IN ('moderator', 'admin')));

-- Event Categories: Alle können lesen
CREATE POLICY "event_categories_select_all" ON event_categories FOR SELECT USING (is_active = true);

-- 15. EVENT CATEGORIES DATEN
INSERT INTO event_categories (name, description, color, icon) VALUES
('Techno', 'Electronic Dance Music Events', '#ff6b6b', 'music'),
('House', 'House Music Events', '#4ecdc4', 'home'),
('Trance', 'Trance Music Events', '#45b7d1', 'zap'),
('Drum & Bass', 'Drum and Bass Events', '#96ceb4', 'activity'),
('Festival', 'Music Festivals', '#feca57', 'calendar'),
('Club', 'Club Events', '#ff9ff3', 'users');

-- 16. INVITE CODES
INSERT INTO invites (code, max_uses, expires_at, metadata) VALUES
('ADMIN1', NULL, NULL, '{"role": "admin", "verification": "admin"}'),
('WELCOM', 100, NOW() + INTERVAL '30 days', '{"role": "user", "verification": "basic"}'),
('INVITE', 50, NOW() + INTERVAL '7 days', '{"role": "user", "verification": "basic"}'),
('PARTY1', 25, NOW() + INTERVAL '3 days', '{"role": "user", "verification": "basic"}'),
('SECURE', 10, NOW() + INTERVAL '1 day', '{"role": "user", "verification": "verified"}');

-- 17. INVITE SETTINGS
INSERT INTO invite_settings (setting_key, setting_value, description) VALUES
('max_attempts_per_ip', '5', 'Maximum invite code attempts per IP per hour'),
('code_expiry_hours', '168', 'Default invite code expiry in hours (7 days)'),
('require_email_verification', 'true', 'Require email verification for new users');

-- 18. TEST BENUTZER (direkt in auth.users)
-- ACHTUNG: In einer echten Supabase-Umgebung sollten diese über die Auth-API erstellt werden
-- Diese INSERT-Statements funktionieren nur wenn du Service-Role-Zugriff hast

-- Das ist ein vereinfachtes Beispiel - in der Praxis solltest du die Benutzer über die Supabase Auth API erstellen

-- 19. INDIZES FÜR PERFORMANCE
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_events_category_id ON events(category_id);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_invites_code ON invites(code);
CREATE INDEX idx_invites_expires_at ON invites(expires_at);
CREATE INDEX idx_event_attendance_event_id ON event_attendance(event_id);
CREATE INDEX idx_event_attendance_user_id ON event_attendance(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- 20. ERFOLG MELDUNG
DO $$
BEGIN
    RAISE NOTICE '✅ RaveTracker v3 Datenbank erfolgreich initialisiert!';
    RAISE NOTICE '📊 Tabellen erstellt: profiles, events, event_categories, invites, etc.';
    RAISE NOTICE '🎵 Event-Kategorien: 6 Kategorien hinzugefügt';
    RAISE NOTICE '🎫 Invite-Codes: 5 Codes erstellt (ADMIN1, WELCOM, INVITE, PARTY1, SECURE)';
    RAISE NOTICE '🛡️ RLS aktiviert mit grundlegenden Policies';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Nächste Schritte:';
    RAISE NOTICE '1. Erstelle Test-Benutzer über Supabase Auth';
    RAISE NOTICE '2. Teste deine Anwendung mit: npm run dev';
    RAISE NOTICE '3. Verwende die Invite-Codes für Registrierung';
END $$;
