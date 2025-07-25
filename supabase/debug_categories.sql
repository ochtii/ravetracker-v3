-- Test: Nur Event Categories erstellen (Debug Version)
-- =================================================

-- Event Categories Tabelle erstellen
CREATE TABLE IF NOT EXISTS event_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6366f1',
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event Categories einfügen (einzeln für bessere Fehlersuche)
INSERT INTO event_categories (name, description, color, icon) VALUES
('Techno', 'Electronic Dance Music Events', '#ff6b6b', 'music');

INSERT INTO event_categories (name, description, color, icon) VALUES
('House', 'House Music Events', '#4ecdc4', 'home');

INSERT INTO event_categories (name, description, color, icon) VALUES
('Trance', 'Trance Music Events', '#45b7d1', 'zap');

INSERT INTO event_categories (name, description, color, icon) VALUES
('Drum & Bass', 'Drum and Bass Events', '#96ceb4', 'activity');

INSERT INTO event_categories (name, description, color, icon) VALUES
('Festival', 'Music Festivals', '#feca57', 'calendar');

INSERT INTO event_categories (name, description, color, icon) VALUES
('Club', 'Club Events', '#ff9ff3', 'users');

-- Test: Prüfe ob die Daten eingefügt wurden
SELECT name, description, color FROM event_categories ORDER BY name;
