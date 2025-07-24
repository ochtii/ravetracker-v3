-- RaveTracker v3.0 - Invite System Seed Data
-- ============================================
-- Initial configuration and seed data for the invite system

-- =====================================================
-- SEED INVITE SETTINGS
-- =====================================================

-- Insert comprehensive default settings
INSERT INTO invite_settings (setting_key, setting_value, updated_by) 
SELECT 
  setting_key,
  setting_value,
  COALESCE(
    (SELECT id FROM profiles WHERE verification_level = 'admin' OR role = 'admin' LIMIT 1),
    (SELECT id FROM profiles ORDER BY created_at LIMIT 1)
  ) as admin_id
FROM (VALUES 
  -- Rate limiting configuration
  ('invite_rate_limit', '{"per_hour": 1, "per_day": 5, "per_week": 10}'),
  
  -- Default validity and cooldown periods
  ('default_validity_days', '30'),
  ('verification_cooldown_days', '30'),
  ('min_account_age_days', '3'),
  
  -- Default invite credits per verification level
  ('default_invite_credits', '{"unverified": 0, "verified": 5, "trusted": 10, "moderator": 20, "admin": 999}'),
  
  -- Security settings
  ('max_code_attempts_per_hour', '10'),
  ('max_code_attempts_per_day', '50'),
  ('ip_block_duration_minutes', '60'),
  ('suspicious_activity_threshold', '5'),
  
  -- System behavior
  ('auto_cleanup_enabled', 'true'),
  ('auto_cleanup_interval_hours', '24'),
  ('notification_enabled', 'true'),
  ('action_codes_enabled', 'true'),
  
  -- Code generation settings
  ('code_length', '6'),
  ('code_charset', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'),
  ('blacklisted_codes', '["HITLER", "NAZI", "FUCK", "SHIT", "DAMN", "HELL", "BITCH", "ASSHOLE"]'),
  
  -- Email notifications
  ('email_notifications_enabled', 'true'),
  ('invite_expiry_warning_days', '7'),
  ('verification_reminder_days', '14'),
  
  -- Analytics and monitoring
  ('analytics_enabled', 'true'),
  ('detailed_logging_enabled', 'true'),
  ('performance_monitoring_enabled', 'true')
) AS settings(setting_key, setting_value)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  updated_at = NOW();

-- =====================================================
-- SEED ADMIN ACCOUNTS WITH CREDITS
-- =====================================================

-- Update existing admin accounts with proper verification level and credits
UPDATE profiles 
SET 
  verification_level = 'admin',
  invite_credits = GREATEST(invite_credits, 999)
WHERE role = 'admin' OR verification_level = 'admin';

-- Update existing moderators
UPDATE profiles 
SET 
  verification_level = CASE 
    WHEN role = 'admin' THEN 'admin'::verification_level
    WHEN role = 'organizer' OR is_organizer = true THEN 'moderator'::verification_level
    ELSE verification_level
  END,
  invite_credits = CASE 
    WHEN role = 'admin' THEN 999
    WHEN role = 'organizer' OR is_organizer = true THEN GREATEST(invite_credits, 20)
    ELSE invite_credits
  END
WHERE role IN ('admin', 'organizer') OR is_organizer = true;

-- Update verified users
UPDATE profiles 
SET 
  verification_level = 'verified',
  invite_credits = GREATEST(invite_credits, 5)
WHERE is_verified = true AND verification_level = 'unverified';

-- =====================================================
-- CREATE INITIAL ACTION CODES (Optional)
-- =====================================================

-- Create a welcome action code for initial system launch
DO $$
DECLARE
  admin_profile_id UUID;
  welcome_code VARCHAR(6);
BEGIN
  -- Get the first admin profile
  SELECT id INTO admin_profile_id 
  FROM profiles 
  WHERE verification_level = 'admin' OR role = 'admin' 
  LIMIT 1;
  
  -- Only create if we have an admin
  IF admin_profile_id IS NOT NULL THEN
    -- Generate a specific welcome code
    welcome_code := 'LAUNCH';
    
    -- Insert welcome action code
    INSERT INTO invites (
      code, 
      created_by, 
      expires_at, 
      is_action_code, 
      max_uses, 
      current_uses
    ) VALUES (
      welcome_code,
      admin_profile_id,
      NOW() + INTERVAL '90 days', -- 3 months validity
      true,
      100, -- Can be used 100 times
      0
    ) ON CONFLICT (code) DO NOTHING;
    
    -- Log the creation
    RAISE NOTICE 'Created welcome action code: % (valid for 90 days, 100 uses)', welcome_code;
  END IF;
END $$;

-- =====================================================
-- CREATE SYSTEM MAINTENANCE FUNCTIONS
-- =====================================================

-- Function to get invite system statistics
CREATE OR REPLACE FUNCTION get_invite_system_stats()
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_invites', (SELECT COUNT(*) FROM invites),
    'active_invites', (SELECT COUNT(*) FROM invites WHERE is_active = true AND expires_at > NOW()),
    'used_invites', (SELECT COUNT(*) FROM invites WHERE used_by IS NOT NULL),
    'action_codes', (SELECT COUNT(*) FROM invites WHERE is_action_code = true),
    'total_users', (SELECT COUNT(*) FROM profiles),
    'verified_users', (SELECT COUNT(*) FROM profiles WHERE verification_level != 'unverified'),
    'pending_verifications', (SELECT COUNT(*) FROM verification_requests WHERE status = 'pending'),
    'today_registrations', (
      SELECT COUNT(*) FROM profiles 
      WHERE created_at >= CURRENT_DATE
    ),
    'invite_attempts_today', (
      SELECT COUNT(*) FROM invite_attempts 
      WHERE attempted_at >= CURRENT_DATE
    ),
    'failed_attempts_today', (
      SELECT COUNT(*) FROM invite_attempts 
      WHERE attempted_at >= CURRENT_DATE AND success = false
    )
  ) INTO stats;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset user invite credits based on verification level
CREATE OR REPLACE FUNCTION reset_user_invite_credits()
RETURNS TABLE(user_id UUID, old_credits INTEGER, new_credits INTEGER) AS $$
BEGIN
  RETURN QUERY
  UPDATE profiles 
  SET invite_credits = CASE verification_level
    WHEN 'verified' THEN GREATEST(invite_credits, 5)
    WHEN 'trusted' THEN GREATEST(invite_credits, 10)
    WHEN 'moderator' THEN GREATEST(invite_credits, 20)
    WHEN 'admin' THEN 999
    ELSE invite_credits
  END
  WHERE verification_level IN ('verified', 'trusted', 'moderator', 'admin')
  RETURNING id, invite_credits - CASE verification_level
    WHEN 'verified' THEN 5
    WHEN 'trusted' THEN 10
    WHEN 'moderator' THEN 20
    WHEN 'admin' THEN 999
    ELSE 0
  END, invite_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on utility functions to authenticated users
GRANT EXECUTE ON FUNCTION get_invite_system_stats() TO authenticated;

-- Grant execute permissions on admin functions to admin role only
GRANT EXECUTE ON FUNCTION reset_user_invite_credits() TO authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Invite System Seed Data Applied Successfully!';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Default settings configured: % entries', (SELECT COUNT(*) FROM invite_settings);
  RAISE NOTICE 'Admin accounts updated: % users', (SELECT COUNT(*) FROM profiles WHERE verification_level = 'admin');
  RAISE NOTICE 'Verified users updated: % users', (SELECT COUNT(*) FROM profiles WHERE verification_level != 'unverified');
  RAISE NOTICE 'System is ready for invite-based registration!';
  RAISE NOTICE '=================================================';
END $$;
