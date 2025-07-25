-- Step 1: Minimal Database Test
-- ============================
-- Führe diese Queries einzeln aus um den Fehler zu lokalisieren

-- Test 1: Schaue welche Tabellen bereits existieren
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Test 2: Versuche Event Categories Tabelle zu erstellen
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

-- Test 3: Einen einzelnen Eintrag einfügen
INSERT INTO event_categories (name, description, color, icon) VALUES
('Techno', 'Electronic Dance Music Events', '#ff6b6b', 'music');

-- Test 4: Prüfen ob es funktioniert hat
SELECT * FROM event_categories;
