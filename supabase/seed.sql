-- RaveTracker v3.0 - Seed Data
-- ============================
-- Test data for development and demonstration

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
('550e8400-e29b-41d4-a716-44665544000A', 'Club Night', 'Indoor club events and parties', 'club', '#FDCB6E', 10);

-- =====================================================
-- TEST USER PROFILES
-- =====================================================

-- Note: These would typically be created via auth.users first
-- For testing purposes, we'll create some sample profiles
-- In production, these would be created automatically via the trigger

INSERT INTO profiles (id, user_id, username, first_name, last_name, bio, birth_date, favorite_genres, location_city, location_country, is_organizer, is_verified, social_links) VALUES

-- Organizer profiles
('650e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', 'beat_master', 'Alex', 'Schmidt', 'Techno producer and event organizer from Berlin. Been in the scene for over 10 years.', '1990-03-15', '{"techno", "house", "minimal"}', 'Berlin', 'Germany', true, true, '{"instagram": "@beat_master_berlin", "soundcloud": "beatmaster", "website": "https://beatmaster.de"}'),

('650e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440002', 'rave_queen', 'Sarah', 'Johnson', 'Trance DJ and festival organizer. Spreading good vibes across Europe!', '1992-07-22', '{"trance", "psytrance", "progressive"}', 'Amsterdam', 'Netherlands', true, true, '{"instagram": "@rave_queen_official", "facebook": "RaveQueenDJ", "mixcloud": "ravequeenofficial"}'),

('650e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440003', 'bass_drop_mike', 'Michael', 'Brown', 'Dubstep and DnB promoter. Known for organizing the wildest bass events in London.', '1988-11-05', '{"dubstep", "drum_and_bass", "trap"}', 'London', 'United Kingdom', true, true, '{"twitter": "@bassDropMike", "youtube": "BassDropMikeOfficial", "spotify": "bassdropmike"}'),

('650e8400-e29b-41d4-a716-446655440004', '750e8400-e29b-41d4-a716-446655440004', 'psyc_sounds', 'Luna', 'Garcia', 'Psytrance artist and cosmic event creator. Let s explore the universe through sound!', '1991-09-18', '{"psytrance", "goa", "ambient"}', 'Barcelona', 'Spain', true, false, '{"soundcloud": "psycsounds", "bandcamp": "lunagarciamusic"}'),

-- Regular user profiles
('650e8400-e29b-41d4-a716-446655440005', '750e8400-e29b-41d4-a716-446655440005', 'techno_lover', 'David', 'Mueller', 'Berlin techno enthusiast. Always hunting for the next underground party.', '1995-02-14', '{"techno", "minimal", "tech_house"}', 'Berlin', 'Germany', false, false, '{"instagram": "@techno_lover_berlin"}'),

('650e8400-e29b-41d4-a716-446655440006', '750e8400-e29b-41d4-a716-446655440006', 'trance_family', 'Emma', 'Williams', 'Trance music saved my soul. PLUR forever! 🌈', '1997-06-30', '{"trance", "uplifting", "vocal_trance"}', 'Manchester', 'United Kingdom', false, false, '{"instagram": "@trance_family_uk", "twitter": "@trancefamilyuk"}'),

('650e8400-e29b-41d4-a716-446655440007', '750e8400-e29b-41d4-a716-446655440007', 'festival_nomad', 'James', 'Anderson', 'Traveling the world one festival at a time. Music is my religion.', '1993-12-08', '{"house", "techno", "trance", "psytrance"}', 'Stockholm', 'Sweden', false, false, '{"instagram": "@festival_nomad_official", "blog": "festivalnomad.com"}'),

('650e8400-e29b-41d4-a716-446655440008', '750e8400-e29b-41d4-a716-446655440008', 'rave_newbie', 'Sophie', 'Martin', 'New to the rave scene but loving every moment! Always looking for recommendations.', '1999-04-12', '{"house", "future_house"}', 'Paris', 'France', false, false, '{"instagram": "@sophie_discovers_rave"}');

-- =====================================================
-- SAMPLE EVENTS
-- =====================================================

INSERT INTO events (
    id, title, description, slug, date_time, end_time, timezone,
    location_name, location_address, location_city, location_country,
    venue_type, price_min, price_max, currency, capacity, age_restriction,
    genres, tags, lineup, organizer_id, category_id, status,
    is_featured, ticket_url, website_url, social_links, view_count, like_count
) VALUES

-- Upcoming events
(
    '850e8400-e29b-41d4-a716-446655440001',
    'Berghain Presents: Underground Techno Marathon',
    'Join us for an epic 12-hour journey through the depths of Berlin techno. Featuring international artists and the best sound system in the city. This is not just a party, it''s a spiritual experience.',
    'berghain-underground-techno-marathon-2025-08-15',
    '2025-08-15 22:00:00+02:00',
    '2025-08-16 10:00:00+02:00',
    'Europe/Berlin',
    'Berghain',
    'Am Wriezener Bahnhof, 10243 Berlin',
    'Berlin',
    'Germany',
    'indoor',
    25.00,
    35.00,
    'EUR',
    1500,
    18,
    ARRAY['techno', 'minimal', 'industrial'],
    ARRAY['underground', 'berlin', 'marathon', 'berghain'],
    ARRAY['Ben Klock', 'Marcel Dettmann', 'Function', 'Rødhåd'],
    '650e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    'published',
    true,
    'https://berghain.de/tickets',
    'https://berghain.de',
    '{"facebook": "BerghainBerlin", "instagram": "@berghain"}',
    1250,
    89
),

(
    '850e8400-e29b-41d4-a716-446655440002',
    'Luminosity Beach Festival 2025',
    'The most beautiful trance festival returns to the Dutch coastline! 3 days of uplifting trance, breathtaking sunsets, and an unforgettable beach experience.',
    'luminosity-beach-festival-2025-06-20',
    '2025-06-20 14:00:00+02:00',
    '2025-06-22 02:00:00+02:00',
    'Europe/Amsterdam',
    'Bloemendaal Beach',
    'Zeeweg 72, 2051 EC Overveen',
    'Amsterdam',
    'Netherlands',
    'outdoor',
    125.00,
    195.00,
    'EUR',
    8000,
    16,
    ARRAY['trance', 'uplifting', 'progressive', 'vocal_trance'],
    ARRAY['festival', 'beach', 'trance', 'luminosity'],
    ARRAY['Armin van Buuren', 'Ferry Corsten', 'Aly & Fila', 'Cosmic Gate', 'John O''Callaghan'],
    '650e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003',
    'published',
    true,
    'https://luminosity-events.nl/tickets',
    'https://luminosity-events.nl',
    '{"facebook": "LuminosityEvents", "instagram": "@luminosity_events"}',
    3400,
    267
),

(
    '850e8400-e29b-41d4-a716-446655440003',
    'Bass Warehouse: London Underground',
    'The biggest bass music event in London is back! Featuring the heaviest dubstep and drum & bass artists in a massive warehouse space.',
    'bass-warehouse-london-underground-2025-07-12',
    '2025-07-12 20:00:00+01:00',
    '2025-07-13 06:00:00+01:00',
    'Europe/London',
    'Printworks',
    'Surrey Quays Road, London SE16 7PJ',
    'London',
    'United Kingdom',
    'indoor',
    30.00,
    45.00,
    'GBP',
    3000,
    18,
    ARRAY['dubstep', 'drum_and_bass', 'trap', 'future_bass'],
    ARRAY['bass', 'warehouse', 'london', 'underground'],
    ARRAY['Skrillex', 'Netsky', 'Sub Focus', 'Modestep', 'Zomboy'],
    '650e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440006',
    'published',
    true,
    'https://printworksevents.co.uk/tickets',
    'https://basswarehouse.london',
    '{"facebook": "BassWarehouseLondon", "instagram": "@basswarehouse_london"}',
    2100,
    156
),

(
    '850e8400-e29b-41d4-a716-446655440004',
    'Cosmic Journey: Psytrance Gathering',
    'Join us for a transcendental journey through cosmic soundscapes. A small, intimate gathering for true psytrance lovers in the beautiful Spanish mountains.',
    'cosmic-journey-psytrance-gathering-2025-09-05',
    '2025-09-05 18:00:00+02:00',
    '2025-09-06 08:00:00+02:00',
    'Europe/Madrid',
    'Mountain Spirit Venue',
    'Sierra de Guadarrama, 28470 Cercedilla',
    'Barcelona',
    'Spain',
    'outdoor',
    20.00,
    30.00,
    'EUR',
    500,
    16,
    ARRAY['psytrance', 'goa', 'progressive_psy', 'forest'],
    ARRAY['psytrance', 'cosmic', 'mountains', 'spiritual'],
    ARRAY['Infected Mushroom', 'Vini Vici', 'Astrix', 'Captain Hook'],
    '650e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440004',
    'published',
    false,
    'https://cosmic-journey.es/tickets',
    'https://cosmic-journey.es',
    '{"facebook": "CosmicJourneyFestival", "instagram": "@cosmic_journey_fest"}',
    750,
    67
),

(
    '850e8400-e29b-41d4-a716-446655440005',
    'House Music Unity: Amsterdam Edition',
    'A celebration of house music culture bringing together the best local and international DJs. Deep house, tech house, and everything in between.',
    'house-music-unity-amsterdam-2025-05-18',
    '2025-05-18 21:00:00+02:00',
    '2025-05-19 05:00:00+02:00',
    'Europe/Amsterdam',
    'De School',
    'Doctor Jan van Breemenstraat 1, 1056 AB Amsterdam',
    'Amsterdam',
    'Netherlands',
    'indoor',
    18.00,
    25.00,
    'EUR',
    1200,
    18,
    ARRAY['house', 'deep_house', 'tech_house', 'minimal'],
    ARRAY['house', 'unity', 'amsterdam', 'underground'],
    ARRAY['Dixon', 'Âme', 'Black Coffee', 'Jamie Jones', 'Hot Since 82'],
    '650e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440002',
    'published',
    false,
    'https://deschool.nl/tickets',
    'https://housemusicunity.nl',
    '{"facebook": "HouseMusicUnity", "instagram": "@house_music_unity"}',
    890,
    78
),

-- Draft events (organizer testing)
(
    '850e8400-e29b-41d4-a716-446655440006',
    'Secret Techno Session',
    'Location TBA. Details will be revealed 48 hours before the event. This is going to be special.',
    NULL, -- Will be auto-generated
    '2025-10-31 23:00:00+01:00',
    '2025-11-01 07:00:00+01:00',
    'Europe/Berlin',
    'Secret Location',
    'Berlin, Germany',
    'Berlin',
    'Germany',
    'indoor',
    15.00,
    20.00,
    'EUR',
    300,
    21,
    ARRAY['techno', 'dark_techno', 'industrial'],
    ARRAY['secret', 'underground', 'invite_only'],
    ARRAY['TBA'],
    '650e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    'draft',
    false,
    NULL,
    NULL,
    '{}',
    0,
    0
),

-- Past event (for testing history)
(
    '850e8400-e29b-41d4-a716-446655440007',
    'New Year Trance Celebration 2025',
    'We celebrated the new year with the most uplifting trance music! Thank you to everyone who joined us for this magical night.',
    'new-year-trance-celebration-2025-01-01',
    '2025-01-01 22:00:00+01:00',
    '2025-01-02 06:00:00+01:00',
    'Europe/Amsterdam',
    'Ziggo Dome',
    'De Passage 100, 1101 AX Amsterdam',
    'Amsterdam',
    'Netherlands',
    'indoor',
    45.00,
    65.00,
    'EUR',
    15000,
    16,
    ARRAY['trance', 'uplifting', 'vocal_trance', 'progressive'],
    ARRAY['new_year', 'celebration', 'trance', 'amsterdam'],
    ARRAY['Armin van Buuren', 'Above & Beyond', 'Paul van Dyk', 'Andrew Rayel'],
    '650e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003',
    'completed',
    true,
    NULL,
    'https://newyeartrance.nl',
    '{"facebook": "NewYearTrance", "instagram": "@new_year_trance"}',
    5600,
    423
);

-- =====================================================
-- EVENT ATTENDANCE DATA
-- =====================================================

INSERT INTO event_attendance (user_id, event_id, status, notes, created_at) VALUES

-- Berghain Techno Marathon attendees
('750e8400-e29b-41d4-a716-446655440005', '850e8400-e29b-41d4-a716-446655440001', 'going', 'Cannot wait! My first time at Berghain!', '2025-07-01 10:30:00+00:00'),
('750e8400-e29b-41d4-a716-446655440006', '850e8400-e29b-41d4-a716-446655440001', 'interested', 'Looks amazing but need to check my schedule', '2025-07-02 14:20:00+00:00'),
('750e8400-e29b-41d4-a716-446655440007', '850e8400-e29b-41d4-a716-446655440001', 'going', 'Berlin techno is life!', '2025-07-03 16:45:00+00:00'),

-- Luminosity Festival attendees
('750e8400-e29b-41d4-a716-446655440006', '850e8400-e29b-41d4-a716-446655440002', 'going', 'Already booked my flights! Trance family unite!', '2025-04-15 09:00:00+00:00'),
('750e8400-e29b-41d4-a716-446655440007', '850e8400-e29b-41d4-a716-446655440002', 'going', 'This festival changed my life last year', '2025-04-16 11:30:00+00:00'),
('750e8400-e29b-41d4-a716-446655440008', '850e8400-e29b-41d4-a716-446655440002', 'maybe', 'Trying to convince my friends to come with me', '2025-04-18 19:15:00+00:00'),
('750e8400-e29b-41d4-a716-446655440005', '850e8400-e29b-41d4-a716-446655440002', 'interested', 'Love the lineup but not sure about the travel', '2025-04-20 13:45:00+00:00'),

-- Bass Warehouse attendees
('750e8400-e29b-41d4-a716-446655440007', '850e8400-e29b-41d4-a716-446655440003', 'going', 'Need my bass fix!', '2025-06-01 20:30:00+00:00'),
('750e8400-e29b-41d4-a716-446655440008', '850e8400-e29b-41d4-a716-446655440003', 'interested', 'First dubstep event, a bit nervous but excited', '2025-06-05 12:00:00+00:00'),

-- Cosmic Journey attendees
('750e8400-e29b-41d4-a716-446655440007', '850e8400-e29b-41d4-a716-446655440004', 'going', 'Ready for a spiritual journey!', '2025-08-01 15:20:00+00:00'),
('750e8400-e29b-41d4-a716-446655440005', '850e8400-e29b-41d4-a716-446655440004', 'maybe', 'Interesting concept, considering it', '2025-08-03 10:45:00+00:00'),

-- House Music Unity attendees
('750e8400-e29b-41d4-a716-446655440005', '850e8400-e29b-41d4-a716-446655440005', 'going', 'House music all night long!', '2025-04-10 18:30:00+00:00'),
('750e8400-e29b-41d4-a716-446655440006', '850e8400-e29b-41d4-a716-446655440005', 'interested', 'Great lineup but I prefer trance', '2025-04-12 21:15:00+00:00'),
('750e8400-e29b-41d4-a716-446655440008', '850e8400-e29b-41d4-a716-446655440005', 'going', 'My first proper house event!', '2025-04-14 16:00:00+00:00'),

-- Past event attendees (New Year Celebration)
('750e8400-e29b-41d4-a716-446655440006', '850e8400-e29b-41d4-a716-446655440007', 'going', 'Best way to start the year!', '2024-12-01 12:00:00+00:00'),
('750e8400-e29b-41d4-a716-446655440007', '850e8400-e29b-41d4-a716-446655440007', 'going', 'Trance family celebration!', '2024-12-02 14:30:00+00:00'),
('750e8400-e29b-41d4-a716-446655440008', '850e8400-e29b-41d4-a716-446655440007', 'going', 'My first big trance event!', '2024-12-05 10:15:00+00:00'),
('750e8400-e29b-41d4-a716-446655440005', '850e8400-e29b-41d4-a716-446655440007', 'going', 'NYE in Amsterdam = perfection', '2024-12-10 16:45:00+00:00');

-- =====================================================
-- EVENT IMAGES
-- =====================================================

INSERT INTO event_images (event_id, url, alt_text, caption, is_primary, width, height, mime_type) VALUES

-- Berghain images
('850e8400-e29b-41d4-a716-446655440001', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&h=800', 'Dark underground club atmosphere with smoke and lights', 'The legendary Berghain main floor', true, 1200, 800, 'image/jpeg'),
('850e8400-e29b-41d4-a716-446655440001', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=800', 'DJ performing with red lighting', 'Underground techno at its finest', false, 1200, 800, 'image/jpeg'),

-- Luminosity Festival images
('850e8400-e29b-41d4-a716-446655440002', 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200&h=800', 'Beach festival during sunset with crowd silhouettes', 'Luminosity Beach Festival sunset moments', true, 1200, 800, 'image/jpeg'),
('850e8400-e29b-41d4-a716-446655440002', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=800', 'Festival crowd with hands in the air', 'Trance family unity at the beach', false, 1200, 800, 'image/jpeg'),

-- Bass Warehouse images
('850e8400-e29b-41d4-a716-446655440003', 'https://images.unsplash.com/photo-1574769133227-099416b5d2d0?w=1200&h=800', 'Industrial warehouse venue with dramatic lighting', 'Bass Warehouse main room', true, 1200, 800, 'image/jpeg'),
('850e8400-e29b-41d4-a716-446655440003', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=800', 'DJ with bass-heavy setup and crowd', 'Heavy bass drops incoming', false, 1200, 800, 'image/jpeg'),

-- Cosmic Journey images
('850e8400-e29b-41d4-a716-446655440004', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800', 'Mountain landscape with mystical atmosphere', 'Cosmic Journey mountain setting', true, 1200, 800, 'image/jpeg'),

-- House Music Unity images
('850e8400-e29b-41d4-a716-446655440005', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=800', 'Intimate club setting with house music vibes', 'House Music Unity at De School', true, 1200, 800, 'image/jpeg'),

-- New Year Celebration images
('850e8400-e29b-41d4-a716-446655440007', 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1200&h=800', 'Large arena filled with confetti and celebration', 'New Year Trance Celebration 2025', true, 1200, 800, 'image/jpeg');

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

INSERT INTO notifications (user_id, title, message, type, event_id, read, created_at) VALUES

-- Event reminders
('750e8400-e29b-41d4-a716-446655440005', 'Event Tomorrow!', 'Berghain Underground Techno Marathon starts tomorrow at 22:00. Get ready for an epic night!', 'event_reminder', '850e8400-e29b-41d4-a716-446655440001', false, NOW() - INTERVAL '1 day'),

('750e8400-e29b-41d4-a716-446655440006', 'Festival This Weekend!', 'Luminosity Beach Festival starts this Friday! Don''t forget to pack your sunscreen and dancing shoes.', 'event_reminder', '850e8400-e29b-41d4-a716-446655440002', false, NOW() - INTERVAL '2 days'),

-- Event updates
('750e8400-e29b-41d4-a716-446655440007', 'Lineup Update', 'Skrillex has been added to the Bass Warehouse lineup! This is going to be incredible.', 'event_update', '850e8400-e29b-41d4-a716-446655440003', true, NOW() - INTERVAL '5 days'),

-- New events
('750e8400-e29b-41d4-a716-446655440008', 'New Event: House Music Unity', 'A new house music event has been announced in Amsterdam! Check it out.', 'new_event', '850e8400-e29b-41d4-a716-446655440005', true, NOW() - INTERVAL '7 days'),

-- System notifications
('750e8400-e29b-41d4-a716-446655440005', 'Welcome to RaveTracker!', 'Thanks for joining our community! Start discovering amazing events and connect with fellow ravers.', 'system', NULL, true, NOW() - INTERVAL '30 days'),

('750e8400-e29b-41d4-a716-446655440006', 'Profile Verification', 'Your organizer profile has been verified! You can now create and promote events.', 'system', NULL, true, NOW() - INTERVAL '25 days');

-- =====================================================
-- DATA VALIDATION CHECKS
-- =====================================================

-- Verify data integrity
DO $$
DECLARE
    category_count INTEGER;
    profile_count INTEGER;
    event_count INTEGER;
    attendance_count INTEGER;
    notification_count INTEGER;
    image_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO category_count FROM event_categories;
    SELECT COUNT(*) INTO profile_count FROM profiles;
    SELECT COUNT(*) INTO event_count FROM events;
    SELECT COUNT(*) INTO attendance_count FROM event_attendance;
    SELECT COUNT(*) INTO notification_count FROM notifications;
    SELECT COUNT(*) INTO image_count FROM event_images;
    
    RAISE NOTICE 'Seed data summary:';
    RAISE NOTICE '- Event Categories: %', category_count;
    RAISE NOTICE '- Profiles: %', profile_count;
    RAISE NOTICE '- Events: %', event_count;
    RAISE NOTICE '- Attendance Records: %', attendance_count;
    RAISE NOTICE '- Notifications: %', notification_count;
    RAISE NOTICE '- Event Images: %', image_count;
    
    -- Verify all events have valid organizers
    IF EXISTS (
        SELECT 1 FROM events e 
        LEFT JOIN profiles p ON e.organizer_id = p.id 
        WHERE p.id IS NULL
    ) THEN
        RAISE EXCEPTION 'Found events with invalid organizer references';
    END IF;
    
    -- Verify all attendance records reference valid events and users
    IF EXISTS (
        SELECT 1 FROM event_attendance ea
        LEFT JOIN events e ON ea.event_id = e.id
        WHERE e.id IS NULL
    ) THEN
        RAISE EXCEPTION 'Found attendance records with invalid event references';
    END IF;
    
    RAISE NOTICE 'All seed data validation checks passed!';
END $$;

-- =====================================================
-- USEFUL QUERIES FOR TESTING
-- =====================================================

/*
-- Test the search function
SELECT * FROM search_events('techno', NULL, 'Berlin', NULL, NULL, NULL, NULL, NULL, 'published', 10, 0);

-- Test event details function
SELECT * FROM get_event_details('850e8400-e29b-41d4-a716-446655440001');

-- Test user profile function
SELECT * FROM get_user_profile('750e8400-e29b-41d4-a716-446655440005');

-- Test attendance function
SELECT * FROM get_user_events_attendance('750e8400-e29b-41d4-a716-446655440006');

-- Test organizer dashboard
SELECT * FROM get_organizer_dashboard('750e8400-e29b-41d4-a716-446655440001');

-- Test event statistics
SELECT * FROM get_event_statistics('850e8400-e29b-41d4-a716-446655440002');
*/
