-- RaveTracker v3.0 - Invite System Database Schema
-- ================================================
-- Complete schema for invite-based registration system with security policies

-- Enable required extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CUSTOM TYPES
-- =====================================================

-- Verification request status
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected', 'needs_info');

-- Verification levels (extending existing if needed)
DO $$ 
BEGIN
  -- Check if verification_level type exists, if not create it
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_level') THEN
    CREATE TYPE verification_level AS ENUM ('unverified', 'verified', 'trusted', 'moderator', 'admin');
  END IF;
END $$;

-- =====================================================
-- EXTEND PROFILES TABLE
-- =====================================================

-- Add invite system columns to existing profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS invite_credits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS verification_level verification_level DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS registration_invite_code VARCHAR(6);

-- Add constraints for new columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_invite_credits_positive') THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_invite_credits_positive CHECK (invite_credits >= 0);
  END IF;
END $$;-- Update existing users to have default verification level based on role
UPDATE profiles 
SET verification_level = CASE 
  WHEN role = 'admin' THEN 'admin'::verification_level
  WHEN role = 'organizer' OR is_organizer = true THEN 'verified'::verification_level
  WHEN is_verified = true THEN 'verified'::verification_level
  ELSE 'unverified'::verification_level
END
WHERE verification_level = 'unverified';

-- =====================================================
-- INVITES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Invite Code (6-character alphanumeric)
  code VARCHAR(12) NOT NULL UNIQUE,
  
  -- Relations
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  used_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_action_code BOOLEAN DEFAULT false,
  
  -- Usage limits
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  
  -- Constraints
  CONSTRAINT invites_code_format CHECK (
    char_length(code) = 6 AND 
    code ~ '^[A-Z0-9]{6}$'
  ),
  CONSTRAINT invites_max_uses_positive CHECK (max_uses > 0),
  CONSTRAINT invites_current_uses_valid CHECK (
    current_uses >= 0 AND 
    current_uses <= max_uses
  ),
  CONSTRAINT invites_used_consistency CHECK (
    (used_by IS NULL AND used_at IS NULL) OR 
    (used_by IS NOT NULL AND used_at IS NOT NULL)
  ),
  CONSTRAINT invites_expires_future CHECK (expires_at > created_at)
);

-- Indexes for invites table
CREATE INDEX IF NOT EXISTS idx_invites_code ON invites(code);
CREATE INDEX IF NOT EXISTS idx_invites_created_by ON invites(created_by);
CREATE INDEX IF NOT EXISTS idx_invites_used_by ON invites(used_by);
CREATE INDEX IF NOT EXISTS idx_invites_expires_at ON invites(expires_at);
CREATE INDEX IF NOT EXISTS idx_invites_active ON invites(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_invites_action_code ON invites(is_action_code) WHERE is_action_code = true;
CREATE INDEX IF NOT EXISTS idx_invites_created_at ON invites(created_at);

-- =====================================================
-- INVITE SETTINGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS invite_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Setting key-value pairs
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  
  -- Relations
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT invite_settings_key_format CHECK (
    char_length(setting_key) >= 3 AND
    setting_key ~ '^[a-z_]+$'
  )
);

-- Indexes for invite_settings table
CREATE INDEX IF NOT EXISTS idx_invite_settings_key ON invite_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_invite_settings_updated_by ON invite_settings(updated_by);

-- =====================================================
-- INVITE ATTEMPTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS invite_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Attempt information
  code_attempted VARCHAR(6) NOT NULL,
  ip_address INET NOT NULL,
  email_attempted VARCHAR(320), -- RFC 5321 max email length
  success BOOLEAN NOT NULL DEFAULT false,
  user_agent TEXT,
  
  -- Metadata
  attempt_data JSONB DEFAULT '{}',
  
  -- Timestamps
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT invite_attempts_code_format CHECK (
    char_length(code_attempted) <= 12 AND
    code_attempted ~ '^[A-Z0-9]+$'
  ),
  CONSTRAINT invite_attempts_email_format CHECK (
    email_attempted IS NULL OR 
    email_attempted ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
  )
);

-- Indexes for invite_attempts table
CREATE INDEX IF NOT EXISTS idx_invite_attempts_code ON invite_attempts(code_attempted);
CREATE INDEX IF NOT EXISTS idx_invite_attempts_ip ON invite_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_invite_attempts_email ON invite_attempts(email_attempted);
CREATE INDEX IF NOT EXISTS idx_invite_attempts_success ON invite_attempts(success);
CREATE INDEX IF NOT EXISTS idx_invite_attempts_attempted_at ON invite_attempts(attempted_at);
CREATE INDEX IF NOT EXISTS idx_invite_attempts_ip_time ON invite_attempts(ip_address, attempted_at);

-- =====================================================
-- VERIFICATION REQUESTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relations
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recommended_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Request content
  request_message TEXT NOT NULL,
  admin_notes TEXT,
  
  -- Status
  status verification_status DEFAULT 'pending',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT verification_requests_message_length CHECK (
    char_length(request_message) >= 10 AND 
    char_length(request_message) <= 2000
  ),
  CONSTRAINT verification_requests_review_consistency CHECK (
    (status = 'pending' AND reviewed_by IS NULL AND reviewed_at IS NULL) OR
    (status != 'pending' AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
  ),
  CONSTRAINT verification_requests_one_per_user UNIQUE (user_id, status) 
    DEFERRABLE INITIALLY DEFERRED
);

-- Indexes for verification_requests table
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_recommended_by ON verification_requests(recommended_by);
CREATE INDEX IF NOT EXISTS idx_verification_requests_reviewed_by ON verification_requests(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_verification_requests_created_at ON verification_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_verification_requests_pending ON verification_requests(status, created_at) 
  WHERE status = 'pending';

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to generate secure invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS VARCHAR(6) AS $$
DECLARE
  characters TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code VARCHAR(6) := '';
  i INTEGER;
  blacklisted_codes TEXT[] := ARRAY['HITLER', 'NAZI', 'FUCK', 'SHIT', 'DAMN', 'HELL'];
BEGIN
  LOOP
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr(characters, floor(random() * length(characters) + 1)::int, 1);
    END LOOP;
    
    -- Check if code is blacklisted or already exists
    IF NOT (code = ANY(blacklisted_codes)) AND 
       NOT EXISTS(SELECT 1 FROM invites WHERE invites.code = code) THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update invite credits based on verification level
CREATE OR REPLACE FUNCTION update_invite_credits_on_verification()
RETURNS TRIGGER AS $$
DECLARE
  default_credits INTEGER;
BEGIN
  -- Determine default credits based on verification level
  default_credits := CASE NEW.verification_level
    WHEN 'verified' THEN 5
    WHEN 'trusted' THEN 10
    WHEN 'moderator' THEN 20
    WHEN 'admin' THEN 999
    ELSE 0
  END;
  
  -- Only increase credits, never decrease
  IF NEW.invite_credits < default_credits THEN
    NEW.invite_credits := default_credits;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic credit assignment
DROP TRIGGER IF EXISTS trigger_update_invite_credits ON profiles;
CREATE TRIGGER trigger_update_invite_credits
  BEFORE UPDATE OF verification_level ON profiles
  FOR EACH ROW
  WHEN (OLD.verification_level IS DISTINCT FROM NEW.verification_level)
  EXECUTE FUNCTION update_invite_credits_on_verification();

-- Function to automatically expire old invites
CREATE OR REPLACE FUNCTION cleanup_expired_invites()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE invites 
  SET is_active = false 
  WHERE expires_at < NOW() AND is_active = true;
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean old invite attempts (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_invite_attempts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM invite_attempts 
  WHERE attempted_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

-- Invites table policies
DROP POLICY IF EXISTS "Users can view their own invites" ON invites;
CREATE POLICY "Users can view their own invites" ON invites
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    created_by IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create invites" ON invites;
CREATE POLICY "Users can create invites" ON invites
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    created_by IN (SELECT id FROM profiles WHERE user_id = auth.uid()) AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND verification_level IN ('verified', 'trusted', 'moderator', 'admin')
      AND invite_credits > 0
    )
  );

DROP POLICY IF EXISTS "Users can update their own invites" ON invites;
CREATE POLICY "Users can update their own invites" ON invites
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND 
    created_by IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can manage all invites" ON invites;
CREATE POLICY "Admins can manage all invites" ON invites
  FOR ALL USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND verification_level = 'admin'
    )
  );

-- Invite settings policies
DROP POLICY IF EXISTS "Everyone can read invite settings" ON invite_settings;
CREATE POLICY "Everyone can read invite settings" ON invite_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can modify invite settings" ON invite_settings;
CREATE POLICY "Only admins can modify invite settings" ON invite_settings
  FOR ALL USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND verification_level = 'admin'
    )
  );

-- Invite attempts policies (admin only for security)
DROP POLICY IF EXISTS "Only admins can view invite attempts" ON invite_attempts;
CREATE POLICY "Only admins can view invite attempts" ON invite_attempts
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND verification_level = 'admin'
    )
  );

DROP POLICY IF EXISTS "System can log invite attempts" ON invite_attempts;
CREATE POLICY "System can log invite attempts" ON invite_attempts
  FOR INSERT WITH CHECK (true);

-- Verification requests policies
DROP POLICY IF EXISTS "Users can view their own verification requests" ON verification_requests;
CREATE POLICY "Users can view their own verification requests" ON verification_requests
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create verification requests" ON verification_requests;
CREATE POLICY "Users can create verification requests" ON verification_requests
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) AND
    NOT EXISTS (
      SELECT 1 FROM verification_requests vr
      WHERE vr.user_id = verification_requests.user_id
      AND vr.status = 'pending'
    )
  );

DROP POLICY IF EXISTS "Admins and moderators can manage verification requests" ON verification_requests;
CREATE POLICY "Admins and moderators can manage verification requests" ON verification_requests
  FOR ALL USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND verification_level IN ('admin', 'moderator')
    )
  );

-- =====================================================
-- INITIAL DATA SEEDING
-- =====================================================

-- Insert default settings
DO $$
DECLARE
  admin_id UUID;
BEGIN
  -- Try to find an admin profile
  SELECT id INTO admin_id FROM profiles WHERE verification_level = 'admin' LIMIT 1;
  
  -- Insert default settings
  INSERT INTO invite_settings (setting_key, setting_value, updated_by) 
  SELECT 
    setting_key,
    setting_value,
    admin_id  -- Will be NULL if no admin exists
  FROM (VALUES 
    ('invite_rate_limit', '{"per_hour": 1, "per_day": 5, "per_week": 10}'),
    ('default_validity_days', '30'),
    ('verification_cooldown_days', '30'),
    ('min_account_age_days', '3'),
    ('default_invite_credits', '{"unverified": 0, "verified": 5, "trusted": 10, "moderator": 20, "admin": 999}'),
    ('max_code_attempts_per_hour', '10'),
    ('max_code_attempts_per_day', '50'),
    ('auto_cleanup_enabled', 'true'),
    ('notification_enabled', 'true'),
    ('action_codes_enabled', 'true')
  ) AS settings(setting_key, setting_value)
  ON CONFLICT (setting_key) DO NOTHING;
END $$;

-- Grant initial invite credits to verified users
UPDATE profiles 
SET invite_credits = CASE verification_level
  WHEN 'verified' THEN GREATEST(invite_credits, 5)
  WHEN 'trusted' THEN GREATEST(invite_credits, 10)
  WHEN 'moderator' THEN GREATEST(invite_credits, 20)
  WHEN 'admin' THEN 999
  ELSE invite_credits
END
WHERE verification_level IN ('verified', 'trusted', 'moderator', 'admin');

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE invites IS 'Invitation codes for user registration';
COMMENT ON TABLE invite_settings IS 'System-wide invite system configuration';
COMMENT ON TABLE invite_attempts IS 'Log of all invite code validation attempts';
COMMENT ON TABLE verification_requests IS 'User verification requests for admin review';

COMMENT ON COLUMN invites.code IS 'Unique 6-character alphanumeric invitation code';
COMMENT ON COLUMN invites.is_action_code IS 'True for admin-created multi-use codes';
COMMENT ON COLUMN invites.max_uses IS 'Maximum times this code can be used (1 for normal invites)';
COMMENT ON COLUMN invites.current_uses IS 'Current number of times this code has been used';

COMMENT ON COLUMN invite_settings.setting_key IS 'Unique identifier for the setting';
COMMENT ON COLUMN invite_settings.setting_value IS 'JSON-encoded setting value';

COMMENT ON COLUMN verification_requests.request_message IS 'User-provided reason for verification';
COMMENT ON COLUMN verification_requests.admin_notes IS 'Admin notes for the verification decision';

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Grant select permissions for settings (public read)
GRANT SELECT ON invite_settings TO anon, authenticated;

-- Grant necessary permissions for authenticated users
GRANT SELECT, INSERT, UPDATE ON invites TO authenticated;
GRANT SELECT, INSERT, UPDATE ON verification_requests TO authenticated;
GRANT INSERT ON invite_attempts TO anon, authenticated;

COMMIT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Invite system database schema created successfully!';
  RAISE NOTICE 'Tables created: invites, invite_settings, invite_attempts, verification_requests';
  RAISE NOTICE 'Profiles table extended with invite system columns';
  RAISE NOTICE 'RLS policies configured for security';
  RAISE NOTICE 'Initial settings and data seeded';
END $$;
