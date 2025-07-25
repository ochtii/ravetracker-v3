-- Manual profile sync for authenticated users 
-- This bypasses RLS by using the correct SQL approach

-- First, let's see what auth users actually exist
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  raw_user_meta_data
FROM auth.users 
ORDER BY created_at;

-- Now let's manually insert profiles for the existing auth users
-- Using INSERT ... ON CONFLICT to avoid duplicates

-- Admin user profile
INSERT INTO profiles (
  id,
  user_id,
  email,
  username,
  first_name,
  last_name,
  display_name,
  role,
  status,
  is_organizer,
  is_verified,
  is_private,
  invite_credits,
  verification_level,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'c20751f1-b15b-4ca1-9769-1b9f7e71d608',
  'admin@ravetracker.com',
  'admin',
  'System',
  'Admin',
  'System Admin',
  'admin',
  'active',
  true,
  true,
  false,
  50,
  'admin',
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- Organizer user profile  
INSERT INTO profiles (
  id,
  user_id,
  email,
  username,
  first_name,
  last_name,
  display_name,
  role,
  status,
  is_organizer,
  is_verified,
  is_private,
  invite_credits,
  verification_level,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '283383d6-a320-4ea1-90d2-87808c0bf0c4',
  'organizer@ravetracker.com', 
  'organizer',
  'Event',
  'Organizer',
  'Event Organizer',
  'organizer',
  'active',
  true,
  true,
  false,
  20,
  'trusted',
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- Test User 1 profile
INSERT INTO profiles (
  id,
  user_id,
  email,
  username,
  first_name,
  last_name,
  display_name,
  role,
  status,
  is_organizer,
  is_verified,
  is_private,
  invite_credits,
  verification_level,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '7b2c8d1f-4f6a-4c9d-9e3f-8a7b6c5d4e3f',
  'user1@example.com',
  'user1',
  'Test',
  'User',
  'Test User 1',
  'user',
  'active',
  false,
  true,
  false,
  5,
  'verified',
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- Test User 2 profile
INSERT INTO profiles (
  id,
  user_id,
  email,
  username,
  first_name,
  last_name,
  display_name,
  role,
  status,
  is_organizer,
  is_verified,
  is_private,
  invite_credits,
  verification_level,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '9f8e7d6c-5b4a-3c9d-8e7f-6a5b4c3d2e1f',
  'user2@example.com',
  'user2',
  'Test',
  'User 2',
  'Test User 2',
  'user',
  'active',
  false,
  true,
  false,
  5,
  'verified',
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- Moderator user profile
INSERT INTO profiles (
  id,
  user_id,
  email,
  username,
  first_name,
  last_name, 
  display_name,
  role,
  status,
  is_organizer,
  is_verified,
  is_private,
  invite_credits,
  verification_level,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
  'moderator@ravetracker.com',
  'moderator',
  'Content',
  'Moderator',
  'Content Moderator',
  'moderator',
  'active',
  false,
  true,
  false,
  10,
  'moderator',
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- Verification: Show all profiles
SELECT 
  p.username,
  p.email,
  p.role,
  p.verification_level,
  p.invite_credits,
  p.is_organizer,
  p.is_verified,
  p.status,
  p.user_id
FROM profiles p
ORDER BY p.created_at;

-- Show statistics
SELECT 
  'Profile Creation Summary' as summary,
  COUNT(*) as total_profiles,
  COUNT(*) FILTER (WHERE role = 'admin') as admin_count,
  COUNT(*) FILTER (WHERE role = 'organizer') as organizer_count,
  COUNT(*) FILTER (WHERE role = 'moderator') as moderator_count,
  COUNT(*) FILTER (WHERE role = 'user') as user_count,
  COUNT(*) FILTER (WHERE is_organizer = true) as organizer_capable,
  SUM(invite_credits) as total_invite_credits
FROM profiles;
