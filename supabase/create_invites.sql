-- 🎫 5 Invite Codes für RaveTracker v3 erstellen
-- ===============================================

-- Lösche alte Invite Codes (optional)
-- DELETE FROM invites WHERE code IN ('WELCOM', 'PARTY1', 'ADMIN1', 'SECURE', 'RAVE25');

-- Neue Invite Codes erstellen
INSERT INTO invites (code, expires_at, max_uses, metadata) VALUES 
-- 1. WELCOM - Allgemeiner Welcome-Code
('WELCOM', NOW() + INTERVAL '30 days', 50, '{"description": "Welcome invite for new users", "type": "general", "created_by": "system"}'),

-- 2. PARTY1 - Event-spezifischer Code  
('PARTY1', NOW() + INTERVAL '14 days', 25, '{"description": "Party invite code", "type": "event", "created_by": "system"}'),

-- 3. ADMIN1 - Unbegrenzter Admin-Code
('ADMIN1', NOW() + INTERVAL '90 days', NULL, '{"description": "Admin invite (unlimited uses)", "type": "admin", "created_by": "system"}'),

-- 4. SECURE - Limitierter sicherer Code
('SECURE', NOW() + INTERVAL '7 days', 10, '{"description": "Secure limited invite", "type": "limited", "created_by": "system"}'),

-- 5. RAVE25 - Special 2025 Code
('RAVE25', NOW() + INTERVAL '21 days', 100, '{"description": "RaveTracker 2025 special invite", "type": "special", "created_by": "system"}');

-- Prüfung: Zeige alle aktiven Invite Codes
SELECT 
    code,
    expires_at,
    max_uses,
    current_uses,
    is_active,
    metadata->>'description' as description,
    metadata->>'type' as type
FROM invites 
WHERE is_active = true 
ORDER BY expires_at;

-- Zeige Anzahl erstellter Codes
SELECT COUNT(*) as total_invites FROM invites WHERE is_active = true;

-- Erfolg!
SELECT '🎉 5 Invite Codes erfolgreich erstellt!' as status;
