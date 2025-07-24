-- Add Admin Profile Fields
-- =========================
-- Add missing fields to profiles table for admin functionality

-- Add missing fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS display_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'organizer', 'user')),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email_confirmed_at TIMESTAMPTZ;

-- Create indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_last_sign_in ON profiles(last_sign_in_at);

-- Update existing organizer records to have organizer role
UPDATE profiles 
SET role = 'organizer' 
WHERE is_organizer = TRUE AND role = 'user';

-- Function to sync email from auth.users
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
    -- Update email from auth.users when profile is created or updated
    UPDATE profiles 
    SET email = (SELECT email FROM auth.users WHERE id = NEW.user_id)
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync email on profile insert/update
DROP TRIGGER IF EXISTS sync_profile_email_trigger ON profiles;
CREATE TRIGGER sync_profile_email_trigger
    AFTER INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_profile_email();

-- Function to sync last_sign_in from auth.users
CREATE OR REPLACE FUNCTION sync_last_sign_in()
RETURNS TRIGGER AS $$
BEGIN
    -- Update last_sign_in_at from auth.users
    UPDATE profiles 
    SET last_sign_in_at = NEW.last_sign_in_at
    WHERE user_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users to sync sign in data
-- Note: This requires superuser privileges, so it might need to be done manually
-- CREATE TRIGGER sync_last_sign_in_trigger
--     AFTER UPDATE OF last_sign_in_at ON auth.users
--     FOR EACH ROW
--     EXECUTE FUNCTION sync_last_sign_in();

-- Sync existing data
UPDATE profiles 
SET 
    email = (SELECT email FROM auth.users WHERE auth.users.id = profiles.user_id),
    last_sign_in_at = (SELECT last_sign_in_at FROM auth.users WHERE auth.users.id = profiles.user_id),
    email_confirmed_at = (SELECT email_confirmed_at FROM auth.users WHERE auth.users.id = profiles.user_id)
WHERE email IS NULL;
