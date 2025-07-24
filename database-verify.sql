-- Database Verification Script
-- ============================
-- Run this after the main setup to verify everything is working

-- Check if all tables exist
SELECT 
    schemaname,
    tablename,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'event_categories', 'events', 'event_attendance', 'notifications')
ORDER BY tablename;

-- Check if custom types exist
SELECT typname, typtype 
FROM pg_type 
WHERE typname IN ('event_status', 'attendance_status', 'notification_type');

-- Check if foreign key relationships exist
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('profiles', 'events', 'event_attendance', 'notifications')
ORDER BY tc.table_name, tc.constraint_name;

-- Check sample data
SELECT name, description, color FROM event_categories ORDER BY sort_order;

-- Verification summary
DO $$
DECLARE
    table_count INTEGER;
    type_count INTEGER;
    fk_count INTEGER;
    category_count INTEGER;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count
    FROM pg_tables 
    WHERE schemaname = 'public' 
        AND tablename IN ('profiles', 'event_categories', 'events', 'event_attendance', 'notifications');
    
    -- Count types
    SELECT COUNT(*) INTO type_count
    FROM pg_type 
    WHERE typname IN ('event_status', 'attendance_status', 'notification_type');
    
    -- Count foreign keys
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
        AND table_name IN ('profiles', 'events', 'event_attendance', 'notifications');
    
    -- Count categories
    SELECT COUNT(*) INTO category_count FROM event_categories;
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 Database Verification Results:';
    RAISE NOTICE '================================';
    RAISE NOTICE 'Tables created: % / 5', table_count;
    RAISE NOTICE 'Custom types: % / 3', type_count;
    RAISE NOTICE 'Foreign keys: % (should be > 0)', fk_count;
    RAISE NOTICE 'Sample categories: %', category_count;
    RAISE NOTICE '';
    
    IF table_count = 5 AND type_count = 3 AND fk_count > 0 AND category_count > 0 THEN
        RAISE NOTICE '✅ Database setup is COMPLETE and working!';
        RAISE NOTICE '✅ You can now use your RaveTracker application.';
    ELSE
        RAISE NOTICE '❌ Database setup is INCOMPLETE.';
        RAISE NOTICE '❌ Please run the main database-setup.sql script first.';
    END IF;
    
    RAISE NOTICE '';
END $$;
