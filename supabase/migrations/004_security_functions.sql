-- RaveTracker v3.0 - Advanced Security Functions
-- ===============================================
-- Enhanced security functions for role management and access control

-- =====================================================
-- ADMIN MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to promote user to organizer (admin only)
CREATE OR REPLACE FUNCTION admin.promote_to_organizer(
    target_user_id UUID,
    admin_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
DECLARE
    success BOOLEAN := FALSE;
BEGIN
    -- Check if requesting user is admin
    IF NOT auth.is_admin(admin_user_id) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    -- Update user profile to organizer
    UPDATE profiles 
    SET 
        is_organizer = TRUE,
        updated_at = NOW()
    WHERE user_id = target_user_id;
    
    GET DIAGNOSTICS success = FOUND;
    
    -- Log the action
    PERFORM auth.log_security_event(
        'role_promotion',
        admin_user_id,
        'profile',
        (SELECT id FROM profiles WHERE user_id = target_user_id),
        'promote_to_organizer',
        success,
        jsonb_build_object('target_user', target_user_id)
    );
    
    RETURN success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify organizer (admin only)
CREATE OR REPLACE FUNCTION admin.verify_organizer(
    target_user_id UUID,
    admin_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
DECLARE
    success BOOLEAN := FALSE;
BEGIN
    -- Check if requesting user is admin
    IF NOT auth.is_admin(admin_user_id) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    -- Verify organizer
    UPDATE profiles 
    SET 
        is_verified = TRUE,
        updated_at = NOW()
    WHERE user_id = target_user_id AND is_organizer = TRUE;
    
    GET DIAGNOSTICS success = FOUND;
    
    -- Log the action
    PERFORM auth.log_security_event(
        'organizer_verification',
        admin_user_id,
        'profile',
        (SELECT id FROM profiles WHERE user_id = target_user_id),
        'verify_organizer',
        success,
        jsonb_build_object('target_user', target_user_id)
    );
    
    RETURN success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set user role (super admin only)
CREATE OR REPLACE FUNCTION admin.set_user_role(
    target_user_id UUID,
    new_role TEXT,
    admin_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
DECLARE
    success BOOLEAN := FALSE;
    allowed_roles TEXT[] := ARRAY['user', 'organizer', 'moderator', 'admin'];
BEGIN
    -- Check if requesting user is super admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = admin_user_id 
        AND (social_links->>'role')::text = 'super_admin'
    ) THEN
        RAISE EXCEPTION 'Access denied: Super admin privileges required';
    END IF;
    
    -- Validate role
    IF new_role != ALL(allowed_roles) THEN
        RAISE EXCEPTION 'Invalid role: %', new_role;
    END IF;
    
    -- Update user role
    UPDATE profiles 
    SET 
        social_links = jsonb_set(
            COALESCE(social_links, '{}'::jsonb),
            '{role}',
            to_jsonb(new_role)
        ),
        is_organizer = CASE WHEN new_role IN ('organizer', 'moderator', 'admin') THEN TRUE ELSE is_organizer END,
        is_verified = CASE WHEN new_role IN ('moderator', 'admin') THEN TRUE ELSE is_verified END,
        updated_at = NOW()
    WHERE user_id = target_user_id;
    
    GET DIAGNOSTICS success = FOUND;
    
    -- Log the action
    PERFORM auth.log_security_event(
        'role_change',
        admin_user_id,
        'profile',
        (SELECT id FROM profiles WHERE user_id = target_user_id),
        'set_role',
        success,
        jsonb_build_object('target_user', target_user_id, 'new_role', new_role)
    );
    
    RETURN success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- EVENT MODERATION FUNCTIONS
-- =====================================================

-- Function to moderate event (admin/moderator only)
CREATE OR REPLACE FUNCTION admin.moderate_event(
    event_uuid UUID,
    action TEXT, -- 'approve', 'reject', 'feature', 'unfeature', 'hide'
    reason TEXT DEFAULT NULL,
    moderator_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
DECLARE
    success BOOLEAN := FALSE;
    current_status event_status;
BEGIN
    -- Check if requesting user is moderator or admin
    IF NOT auth.is_moderator(moderator_user_id) THEN
        RAISE EXCEPTION 'Access denied: Moderator privileges required';
    END IF;
    
    -- Get current event status
    SELECT status INTO current_status FROM events WHERE id = event_uuid;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Event not found: %', event_uuid;
    END IF;
    
    -- Apply moderation action
    CASE action
        WHEN 'approve' THEN
            UPDATE events SET 
                status = 'published',
                published_at = CASE WHEN status != 'published' THEN NOW() ELSE published_at END,
                updated_at = NOW()
            WHERE id = event_uuid;
            
        WHEN 'reject' THEN
            UPDATE events SET 
                status = 'cancelled',
                updated_at = NOW()
            WHERE id = event_uuid;
            
        WHEN 'feature' THEN
            UPDATE events SET 
                is_featured = TRUE,
                updated_at = NOW()
            WHERE id = event_uuid AND status = 'published';
            
        WHEN 'unfeature' THEN
            UPDATE events SET 
                is_featured = FALSE,
                updated_at = NOW()
            WHERE id = event_uuid;
            
        WHEN 'hide' THEN
            UPDATE events SET 
                status = 'draft',
                published_at = NULL,
                updated_at = NOW()
            WHERE id = event_uuid;
            
        ELSE
            RAISE EXCEPTION 'Invalid moderation action: %', action;
    END CASE;
    
    GET DIAGNOSTICS success = FOUND;
    
    -- Log the moderation action
    PERFORM auth.log_security_event(
        'event_moderation',
        moderator_user_id,
        'event',
        event_uuid,
        action,
        success,
        jsonb_build_object(
            'previous_status', current_status,
            'reason', reason
        )
    );
    
    RETURN success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to moderate image (moderator only)
CREATE OR REPLACE FUNCTION admin.moderate_image(
    image_uuid UUID,
    approved BOOLEAN,
    reason TEXT DEFAULT NULL,
    moderator_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
DECLARE
    success BOOLEAN := FALSE;
BEGIN
    -- Check if requesting user is moderator or admin
    IF NOT auth.is_moderator(moderator_user_id) THEN
        RAISE EXCEPTION 'Access denied: Moderator privileges required';
    END IF;
    
    -- Update image approval status
    UPDATE event_images 
    SET 
        is_approved = approved,
        updated_at = NOW()
    WHERE id = image_uuid;
    
    GET DIAGNOSTICS success = FOUND;
    
    -- Log the moderation action
    PERFORM auth.log_security_event(
        'image_moderation',
        moderator_user_id,
        'event_image',
        image_uuid,
        CASE WHEN approved THEN 'approve' ELSE 'reject' END,
        success,
        jsonb_build_object('reason', reason)
    );
    
    RETURN success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SECURITY MONITORING FUNCTIONS
-- =====================================================

-- Function to get user activity summary
CREATE OR REPLACE FUNCTION admin.get_user_activity(
    target_user_id UUID,
    days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    activity_type TEXT,
    count BIGINT,
    latest_activity TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    -- Events created
    SELECT 
        'events_created'::TEXT,
        COUNT(*)::BIGINT,
        MAX(e.created_at)
    FROM events e
    JOIN profiles p ON e.organizer_id = p.id
    WHERE p.user_id = target_user_id 
    AND e.created_at >= NOW() - INTERVAL '1 day' * days_back
    
    UNION ALL
    
    -- Events attended
    SELECT 
        'events_attended'::TEXT,
        COUNT(*)::BIGINT,
        MAX(ea.created_at)
    FROM event_attendance ea
    WHERE ea.user_id = target_user_id
    AND ea.created_at >= NOW() - INTERVAL '1 day' * days_back
    
    UNION ALL
    
    -- Notifications received
    SELECT 
        'notifications_received'::TEXT,
        COUNT(*)::BIGINT,
        MAX(n.created_at)
    FROM notifications n
    WHERE n.user_id = target_user_id
    AND n.created_at >= NOW() - INTERVAL '1 day' * days_back
    
    UNION ALL
    
    -- Images uploaded
    SELECT 
        'images_uploaded'::TEXT,
        COUNT(*)::BIGINT,
        MAX(ei.created_at)
    FROM event_images ei
    JOIN events e ON ei.event_id = e.id
    JOIN profiles p ON e.organizer_id = p.id
    WHERE p.user_id = target_user_id
    AND ei.created_at >= NOW() - INTERVAL '1 day' * days_back;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get suspicious activity
CREATE OR REPLACE FUNCTION admin.get_suspicious_activity(
    hours_back INTEGER DEFAULT 24
)
RETURNS TABLE (
    user_id UUID,
    activity_type TEXT,
    count BIGINT,
    risk_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    -- Users with excessive event creation
    SELECT 
        p.user_id,
        'excessive_event_creation'::TEXT,
        COUNT(*)::BIGINT,
        CASE 
            WHEN COUNT(*) > 10 THEN 100
            WHEN COUNT(*) > 5 THEN 75
            WHEN COUNT(*) > 2 THEN 50
            ELSE 25
        END::INTEGER
    FROM events e
    JOIN profiles p ON e.organizer_id = p.id
    WHERE e.created_at >= NOW() - INTERVAL '1 hour' * hours_back
    GROUP BY p.user_id
    HAVING COUNT(*) > 2
    
    UNION ALL
    
    -- Users with rapid attendance changes
    SELECT 
        ea.user_id,
        'rapid_attendance_changes'::TEXT,
        COUNT(*)::BIGINT,
        CASE 
            WHEN COUNT(*) > 20 THEN 90
            WHEN COUNT(*) > 10 THEN 60
            ELSE 30
        END::INTEGER
    FROM event_attendance ea
    WHERE ea.updated_at >= NOW() - INTERVAL '1 hour' * hours_back
    GROUP BY ea.user_id
    HAVING COUNT(*) > 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RATE LIMITING FUNCTIONS
-- =====================================================

-- Function to check rate limits
CREATE OR REPLACE FUNCTION auth.check_rate_limit(
    user_uuid UUID,
    action_type TEXT,
    max_actions INTEGER,
    time_window INTERVAL
)
RETURNS BOOLEAN AS $$
DECLARE
    action_count INTEGER;
BEGIN
    -- Count recent actions of this type
    CASE action_type
        WHEN 'event_creation' THEN
            SELECT COUNT(*) INTO action_count
            FROM events e
            JOIN profiles p ON e.organizer_id = p.id
            WHERE p.user_id = user_uuid
            AND e.created_at >= NOW() - time_window;
            
        WHEN 'attendance_change' THEN
            SELECT COUNT(*) INTO action_count
            FROM event_attendance
            WHERE user_id = user_uuid
            AND updated_at >= NOW() - time_window;
            
        WHEN 'image_upload' THEN
            SELECT COUNT(*) INTO action_count
            FROM event_images ei
            JOIN events e ON ei.event_id = e.id
            JOIN profiles p ON e.organizer_id = p.id
            WHERE p.user_id = user_uuid
            AND ei.created_at >= NOW() - time_window;
            
        ELSE
            action_count := 0;
    END CASE;
    
    -- Return whether under the limit
    RETURN action_count < max_actions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- DATA EXPORT FUNCTIONS (GDPR COMPLIANCE)
-- =====================================================

-- Function to export user data
CREATE OR REPLACE FUNCTION admin.export_user_data(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    user_data JSONB;
BEGIN
    -- Build complete user data export
    SELECT jsonb_build_object(
        'profile', (
            SELECT to_jsonb(p.*) 
            FROM profiles p 
            WHERE p.user_id = target_user_id
        ),
        'events', (
            SELECT jsonb_agg(to_jsonb(e.*))
            FROM events e
            JOIN profiles p ON e.organizer_id = p.id
            WHERE p.user_id = target_user_id
        ),
        'attendance', (
            SELECT jsonb_agg(to_jsonb(ea.*))
            FROM event_attendance ea
            WHERE ea.user_id = target_user_id
        ),
        'notifications', (
            SELECT jsonb_agg(to_jsonb(n.*))
            FROM notifications n
            WHERE n.user_id = target_user_id
        ),
        'exported_at', NOW()
    ) INTO user_data;
    
    RETURN user_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CLEANUP FUNCTIONS
-- =====================================================

-- Function to anonymize user data (GDPR right to be forgotten)
CREATE OR REPLACE FUNCTION admin.anonymize_user_data(
    target_user_id UUID,
    admin_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
DECLARE
    success BOOLEAN := FALSE;
    profile_id UUID;
BEGIN
    -- Check if requesting user is admin
    IF NOT auth.is_admin(admin_user_id) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    -- Get profile ID
    SELECT id INTO profile_id FROM profiles WHERE user_id = target_user_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Anonymize profile data
    UPDATE profiles SET
        first_name = 'Anonymized',
        last_name = 'User',
        username = 'anon_' || SUBSTRING(id::text, 1, 8),
        bio = NULL,
        avatar_url = NULL,
        birth_date = NULL,
        social_links = '{}',
        updated_at = NOW()
    WHERE id = profile_id;
    
    -- Anonymize event data
    UPDATE events SET
        title = 'Anonymized Event',
        description = 'This event has been anonymized.',
        updated_at = NOW()
    WHERE organizer_id = profile_id;
    
    -- Remove attendance records
    DELETE FROM event_attendance WHERE user_id = target_user_id;
    
    -- Remove notifications
    DELETE FROM notifications WHERE user_id = target_user_id;
    
    success := TRUE;
    
    -- Log the action
    PERFORM auth.log_security_event(
        'user_anonymization',
        admin_user_id,
        'profile',
        profile_id,
        'anonymize',
        success,
        jsonb_build_object('target_user', target_user_id)
    );
    
    RETURN success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANTS FOR ADMIN FUNCTIONS
-- =====================================================

-- Create admin schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS admin;

-- Grant execute permissions to authenticated users for specific functions
GRANT EXECUTE ON FUNCTION auth.check_rate_limit(UUID, TEXT, INTEGER, INTERVAL) TO authenticated;

-- Admin functions require explicit admin role check within the function
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA admin TO authenticated;
