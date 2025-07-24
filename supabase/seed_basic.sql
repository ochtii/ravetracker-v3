-- RaveTracker v3.0 - Basic Seed Data
-- ====================================
-- Basic data for initial setup (categories only)

-- =====================================================
-- EVENT CATEGORIES SEED DATA
-- =====================================================

INSERT INTO event_categories (id, name, description, icon, color, sort_order) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Techno', 'Hard-hitting electronic beats and hypnotic rhythms', 'techno', '#FF6B6B', 1),
('550e8400-e29b-41d4-a716-446655440002', 'House', 'Deep basslines and four-on-the-floor beats', 'house', '#4ECDC4', 2),
('550e8400-e29b-41d4-a716-446655440003', 'Trance', 'Uplifting melodies and euphoric drops', 'trance', '#45B7D1', 3),
('550e8400-e29b-41d4-a716-446655440004', 'Psytrance', 'Psychedelic soundscapes and driving basslines', 'psytrance', '#96CEB4', 4),
('550e8400-e29b-41d4-a716-446655440005', 'Drum & Bass', 'Fast breakbeats and heavy bass', 'dnb', '#FFEAA7', 5),
('550e8400-e29b-41d4-a716-446655440006', 'Dubstep', 'Wobbly bass and syncopated drum patterns', 'dubstep', '#DDA0DD', 6),
('550e8400-e29b-41d4-a716-446655440007', 'Hardstyle', 'Hard kicks and energetic melodies', 'hardstyle', '#FF7675', 7),
('550e8400-e29b-41d4-a716-446655440008', 'Ambient', 'Atmospheric and experimental soundscapes', 'ambient', '#74B9FF', 8),
('550e8400-e29b-41d4-a716-446655440009', 'Festival', 'Multi-genre festival events', 'festival', '#FD79A8', 9),
('550e8400-e29b-41d4-a716-44665544000A', 'Club Night', 'Indoor club events and parties', 'club', '#FDCB6E', 10)
ON CONFLICT (id) DO NOTHING;

-- Add success message 
SELECT 'Basic seed data applied successfully!' as message;
