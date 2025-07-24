-- Fix profiles table constraints and create test users directly in SQL
-- This will resolve the constraint issues and create profiles manually

-- First, let's check the current constraint
SELECT conname, pg_get_constraintdef(oid) as definition 
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
AND conname = 'profiles_role_check';

-- Drop the problematic constraint if it exists
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add the correct constraint
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'organizer', 'user', 'moderator'));

-- Also check and fix the status constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_status_check 
CHECK (status IN ('active', 'suspended', 'banned'));

-- Disable profile creation trigger temporarily to avoid recursion
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Now create profiles for existing auth users manually
DO $$
DECLARE
    user_record RECORD;
    profile_id UUID;
BEGIN
    -- Get all auth users and create profiles
    FOR user_record IN 
        SELECT 
            id,
            email,
            raw_user_meta_data,
            created_at,
            email_confirmed_at
        FROM auth.users
    LOOP
        -- Check if profile already exists
        IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = user_record.id) THEN
            profile_id := gen_random_uuid();
            
            -- Determine role and settings based on email
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
                email_confirmed_at,
                created_at,
                updated_at,
                invite_credits,
                verification_level
            ) VALUES (
                profile_id,
                user_record.id,
                user_record.email,
                -- Generate username
                CASE 
                    WHEN user_record.email LIKE 'admin@%' THEN 'admin'
                    WHEN user_record.email LIKE 'organizer@%' THEN 'organizer'
                    WHEN user_record.email LIKE 'moderator@%' THEN 'moderator'
                    ELSE CONCAT('user_', SUBSTRING(user_record.id::text, 1, 8))
                END,
                -- First name
                COALESCE(
                    user_record.raw_user_meta_data->>'first_name',
                    CASE 
                        WHEN user_record.email LIKE 'admin@%' THEN 'System'
                        WHEN user_record.email LIKE 'organizer@%' THEN 'Event'
                        WHEN user_record.email LIKE 'moderator@%' THEN 'Content'
                        ELSE 'User'
                    END
                ),
                -- Last name  
                COALESCE(
                    user_record.raw_user_meta_data->>'last_name',
                    CASE 
                        WHEN user_record.email LIKE 'admin@%' THEN 'Admin'
                        WHEN user_record.email LIKE 'organizer@%' THEN 'Organizer'
                        WHEN user_record.email LIKE 'moderator@%' THEN 'Moderator'
                        ELSE SUBSTRING(user_record.id::text, 1, 8)
                    END
                ),
                -- Display name
                CASE 
                    WHEN user_record.email LIKE 'admin@%' THEN 'System Admin'
                    WHEN user_record.email LIKE 'organizer@%' THEN 'Event Organizer'
                    WHEN user_record.email LIKE 'moderator@%' THEN 'Content Moderator'
                    ELSE user_record.email
                END,
                -- Role
                CASE 
                    WHEN user_record.email LIKE 'admin@%' THEN 'admin'
                    WHEN user_record.email LIKE 'organizer@%' THEN 'organizer'
                    WHEN user_record.email LIKE 'moderator@%' THEN 'moderator'
                    ELSE 'user'
                END,
                -- Status
                'active',
                -- Is organizer
                (user_record.email LIKE 'admin@%' OR user_record.email LIKE 'organizer@%'),
                -- Is verified
                true,
                -- Is private
                false,
                -- Email confirmed at
                user_record.email_confirmed_at,
                -- Created at
                user_record.created_at,
                -- Updated at
                NOW(),
                -- Invite credits
                CASE 
                    WHEN user_record.email LIKE 'admin@%' THEN 50
                    WHEN user_record.email LIKE 'organizer@%' THEN 20
                    WHEN user_record.email LIKE 'moderator@%' THEN 10
                    ELSE 5
                END,
                -- Verification level
                CASE 
                    WHEN user_record.email LIKE 'admin@%' THEN 'admin'::verification_level
                    WHEN user_record.email LIKE 'moderator@%' THEN 'moderator'::verification_level
                    WHEN user_record.email LIKE 'organizer@%' THEN 'trusted'::verification_level
                    ELSE 'verified'::verification_level
                END
            );
            
            RAISE NOTICE 'Created profile for user: % (email: %)', user_record.id, user_record.email;
        END IF;
    END LOOP;
    
    -- Report final statistics
    RAISE NOTICE 'Profile creation completed!';
    RAISE NOTICE 'Total profiles: %', (SELECT COUNT(*) FROM profiles);
    RAISE NOTICE 'Admin profiles: %', (SELECT COUNT(*) FROM profiles WHERE role = 'admin');
    RAISE NOTICE 'Organizer profiles: %', (SELECT COUNT(*) FROM profiles WHERE role = 'organizer');
    RAISE NOTICE 'Moderator profiles: %', (SELECT COUNT(*) FROM profiles WHERE role = 'moderator');
    RAISE NOTICE 'User profiles: %', (SELECT COUNT(*) FROM profiles WHERE role = 'user');
END $$;

-- Re-enable the profile creation trigger (fixed version)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create profile if it doesn't exist (avoid recursion)
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = NEW.id) THEN
        INSERT INTO profiles (
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
            email_confirmed_at,
            invite_credits,
            verification_level
        ) VALUES (
            NEW.id,
            NEW.email,
            COALESCE(
                NEW.raw_user_meta_data->>'username',
                CONCAT('user_', SUBSTRING(NEW.id::text, 1, 8))
            ),
            COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
            COALESCE(NEW.raw_user_meta_data->>'last_name', SUBSTRING(NEW.id::text, 1, 8)),
            COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
            COALESCE(NEW.raw_user_meta_data->>'role', 'user')::text,
            'active',
            (NEW.raw_user_meta_data->>'role' IN ('organizer', 'admin')),
            (NEW.email_confirmed_at IS NOT NULL),
            false,
            NEW.email_confirmed_at,
            CASE 
                WHEN NEW.raw_user_meta_data->>'role' = 'admin' THEN 50
                WHEN NEW.raw_user_meta_data->>'role' = 'organizer' THEN 20
                WHEN NEW.raw_user_meta_data->>'role' = 'moderator' THEN 10
                ELSE 5
            END,
            CASE 
                WHEN NEW.raw_user_meta_data->>'role' = 'admin' THEN 'admin'::verification_level
                WHEN NEW.raw_user_meta_data->>'role' = 'moderator' THEN 'moderator'::verification_level
                WHEN NEW.raw_user_meta_data->>'role' = 'organizer' THEN 'trusted'::verification_level
                ELSE 'verified'::verification_level
            END
        );
    END IF;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Final verification
SELECT 
    p.username,
    p.email,
    p.role,
    p.verification_level,
    p.invite_credits,
    p.is_organizer,
    p.is_verified
FROM profiles p
ORDER BY p.created_at;

SELECT 'Migration completed successfully!' as status;
