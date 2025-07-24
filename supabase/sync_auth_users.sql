-- Create script to sync all auth users to profiles table
-- This script ensures all authenticated users have corresponding profile entries

DO $$
DECLARE
    user_record RECORD;
    profile_exists BOOLEAN;
    new_profile_id UUID;
BEGIN
    -- Log start of process
    RAISE NOTICE 'Starting sync of auth.users to profiles table...';
    
    -- Loop through all users in auth.users
    FOR user_record IN 
        SELECT 
            id,
            email,
            raw_user_meta_data,
            created_at,
            last_sign_in_at,
            email_confirmed_at
        FROM auth.users 
        WHERE email IS NOT NULL
    LOOP
        -- Check if profile already exists
        SELECT EXISTS(
            SELECT 1 FROM profiles WHERE user_id = user_record.id
        ) INTO profile_exists;
        
        IF NOT profile_exists THEN
            -- Generate new profile ID
            new_profile_id := gen_random_uuid();
            
            -- Extract user data from metadata
            BEGIN
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
                    last_sign_in_at,
                    email_confirmed_at,
                    created_at,
                    updated_at,
                    -- Invite system fields
                    invite_credits,
                    verification_level
                ) VALUES (
                    new_profile_id,
                    user_record.id,
                    user_record.email,
                    -- Generate unique username from email or metadata
                    COALESCE(
                        user_record.raw_user_meta_data->>'username',
                        user_record.raw_user_meta_data->>'user_name',
                        user_record.raw_user_meta_data->>'preferred_username',
                        CONCAT(
                            'user_',
                            SUBSTRING(user_record.id::text, 1, 8)
                        )
                    ),
                    -- Extract first name
                    COALESCE(
                        user_record.raw_user_meta_data->>'first_name',
                        user_record.raw_user_meta_data->>'given_name',
                        SPLIT_PART(user_record.raw_user_meta_data->>'full_name', ' ', 1)
                    ),
                    -- Extract last name
                    COALESCE(
                        user_record.raw_user_meta_data->>'last_name',
                        user_record.raw_user_meta_data->>'family_name',
                        SPLIT_PART(user_record.raw_user_meta_data->>'full_name', ' ', 2)
                    ),
                    -- Display name
                    COALESCE(
                        user_record.raw_user_meta_data->>'name',
                        user_record.raw_user_meta_data->>'display_name',
                        user_record.raw_user_meta_data->>'full_name',
                        user_record.email
                    ),
                    -- Default role
                    'user',
                    -- Default status
                    'active',
                    -- Default organizer status
                    false,
                    -- Verified if email is confirmed
                    (user_record.email_confirmed_at IS NOT NULL),
                    -- Default privacy
                    false,
                    -- Last sign in
                    user_record.last_sign_in_at,
                    -- Email confirmed
                    user_record.email_confirmed_at,
                    -- Created at
                    user_record.created_at,
                    -- Updated at
                    NOW(),
                    -- Default invite credits (0 for unverified users)
                    CASE 
                        WHEN user_record.email_confirmed_at IS NOT NULL THEN 2
                        ELSE 0
                    END,
                    -- Default verification level
                    CASE 
                        WHEN user_record.email_confirmed_at IS NOT NULL THEN 'verified'::verification_level
                        ELSE 'unverified'::verification_level
                    END
                );
                
                RAISE NOTICE 'Created profile for user: % (email: %)', 
                    user_record.id, user_record.email;
                    
            EXCEPTION WHEN OTHERS THEN
                -- Handle unique constraint violations and other errors
                RAISE WARNING 'Failed to create profile for user % (email: %): %', 
                    user_record.id, user_record.email, SQLERRM;
                    
                -- Try with a different username if username conflict
                IF SQLERRM LIKE '%username%' THEN
                    BEGIN
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
                            last_sign_in_at,
                            email_confirmed_at,
                            created_at,
                            updated_at,
                            invite_credits,
                            verification_level
                        ) VALUES (
                            new_profile_id,
                            user_record.id,
                            user_record.email,
                            -- Fallback username with timestamp
                            CONCAT(
                                'user_',
                                SUBSTRING(user_record.id::text, 1, 8),
                                '_',
                                EXTRACT(EPOCH FROM NOW())::bigint
                            ),
                            COALESCE(
                                user_record.raw_user_meta_data->>'first_name',
                                user_record.raw_user_meta_data->>'given_name',
                                'User'
                            ),
                            COALESCE(
                                user_record.raw_user_meta_data->>'last_name',
                                user_record.raw_user_meta_data->>'family_name',
                                SUBSTRING(user_record.id::text, 1, 8)
                            ),
                            COALESCE(
                                user_record.raw_user_meta_data->>'name',
                                user_record.email
                            ),
                            'user',
                            'active',
                            false,
                            (user_record.email_confirmed_at IS NOT NULL),
                            false,
                            user_record.last_sign_in_at,
                            user_record.email_confirmed_at,
                            user_record.created_at,
                            NOW(),
                            CASE 
                                WHEN user_record.email_confirmed_at IS NOT NULL THEN 2
                                ELSE 0
                            END,
                            CASE 
                                WHEN user_record.email_confirmed_at IS NOT NULL THEN 'verified'::verification_level
                                ELSE 'unverified'::verification_level
                            END
                        );
                        
                        RAISE NOTICE 'Created profile with fallback username for user: %', 
                            user_record.id;
                            
                    EXCEPTION WHEN OTHERS THEN
                        RAISE WARNING 'Final attempt failed for user %: %', 
                            user_record.id, SQLERRM;
                    END;
                END IF;
            END;
        ELSE
            -- Profile exists, update email and other auth fields if necessary
            UPDATE profiles 
            SET 
                email = user_record.email,
                last_sign_in_at = GREATEST(
                    COALESCE(last_sign_in_at, '1970-01-01'::timestamptz), 
                    COALESCE(user_record.last_sign_in_at, '1970-01-01'::timestamptz)
                ),
                email_confirmed_at = COALESCE(email_confirmed_at, user_record.email_confirmed_at),
                updated_at = NOW()
            WHERE user_id = user_record.id
            AND (
                email IS DISTINCT FROM user_record.email OR
                last_sign_in_at IS DISTINCT FROM user_record.last_sign_in_at OR
                email_confirmed_at IS DISTINCT FROM user_record.email_confirmed_at
            );
            
            IF FOUND THEN
                RAISE NOTICE 'Updated profile for existing user: % (email: %)', 
                    user_record.id, user_record.email;
            END IF;
        END IF;
    END LOOP;
    
    -- Final statistics
    RAISE NOTICE 'Sync completed. Profile statistics:';
    RAISE NOTICE 'Total profiles: %', (SELECT COUNT(*) FROM profiles);
    RAISE NOTICE 'Total auth users: %', (SELECT COUNT(*) FROM auth.users);
    RAISE NOTICE 'Verified profiles: %', (SELECT COUNT(*) FROM profiles WHERE verification_level != 'unverified');
    RAISE NOTICE 'Organizer profiles: %', (SELECT COUNT(*) FROM profiles WHERE is_organizer = true);
    RAISE NOTICE 'Admin profiles: %', (SELECT COUNT(*) FROM profiles WHERE role = 'admin');
    
END $$;
