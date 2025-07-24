-- Make User an Organizer
-- ======================
-- Run this script in Supabase SQL Editor to give organizer permissions to a specific user

-- INSTRUCTIONS:
-- 1. Replace 'your-email@example.com' with the actual email address
-- 2. Run this script in Supabase SQL Editor

-- Update user to be an organizer (replace with actual email)
UPDATE profiles 
SET is_organizer = true, 
    updated_at = NOW()
WHERE user_id = (
    SELECT id 
    FROM auth.users 
    WHERE email = 'your-email@example.com'  -- CHANGE THIS EMAIL
);

-- Verify the update
SELECT 
    p.id,
    p.user_id,
    p.first_name,
    p.last_name,
    p.is_organizer,
    p.is_verified,
    u.email
FROM profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE p.is_organizer = true;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Organizer permissions updated!';
    RAISE NOTICE 'Users with organizer permissions can:';
    RAISE NOTICE '- Create and manage events';
    RAISE NOTICE '- Access the admin panel';
    RAISE NOTICE '- Moderate content';
    RAISE NOTICE '';
    RAISE NOTICE 'The user will need to logout and login again to see the changes.';
END $$;
