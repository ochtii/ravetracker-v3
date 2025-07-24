-- RaveTracker v3.0 - Security Triggers and Validation
-- ===================================================
-- Additional security triggers and validation rules

-- =====================================================
-- SECURITY AUDIT TABLE
-- =====================================================

-- Create audit log table for security events
CREATE TABLE IF NOT EXISTS security_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resource_type TEXT,
    resource_id UUID,
    action_type TEXT NOT NULL,
    success BOOLEAN NOT NULL DEFAULT TRUE,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for audit table
CREATE INDEX idx_security_audit_user_id ON security_audit(user_id);
CREATE INDEX idx_security_audit_event_type ON security_audit(event_type);
CREATE INDEX idx_security_audit_created_at ON security_audit(created_at);
CREATE INDEX idx_security_audit_resource ON security_audit(resource_type, resource_id);

-- =====================================================
-- IMPROVED AUDIT LOGGING FUNCTION
-- =====================================================

-- Enhanced security logging function
CREATE OR REPLACE FUNCTION auth.log_security_event(
    event_type TEXT,
    user_uuid UUID,
    resource_type TEXT,
    resource_id UUID,
    action_type TEXT,
    success BOOLEAN,
    details JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
    -- Insert into audit table
    INSERT INTO security_audit (
        event_type,
        user_id,
        resource_type,
        resource_id,
        action_type,
        success,
        details,
        ip_address,
        user_agent
    ) VALUES (
        event_type,
        user_uuid,
        resource_type,
        resource_id,
        action_type,
        success,
        details,
        inet_client_addr(), -- Get client IP
        current_setting('request.headers', true)::jsonb->>'user-agent' -- Get user agent if available
    );
    
    -- Also log critical events to PostgreSQL log
    IF event_type IN ('role_change', 'user_anonymization', 'event_moderation') THEN
        RAISE NOTICE 'CRITICAL_SECURITY_EVENT: % - User: % - Resource: %/% - Action: % - Success: %',
            event_type, user_uuid, resource_type, resource_id, action_type, success;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SECURITY VALIDATION TRIGGERS
-- =====================================================

-- Function to validate profile changes
CREATE OR REPLACE FUNCTION validate_profile_security()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent role escalation by non-admins
    IF OLD.social_links->>'role' IS DISTINCT FROM NEW.social_links->>'role' THEN
        IF NOT auth.is_admin() THEN
            RAISE EXCEPTION 'Access denied: Cannot change role without admin privileges';
        END IF;
        
        -- Log role changes
        PERFORM auth.log_security_event(
            'role_change_attempt',
            auth.uid(),
            'profile',
            NEW.id,
            'update_role',
            TRUE,
            jsonb_build_object(
                'old_role', OLD.social_links->>'role',
                'new_role', NEW.social_links->>'role'
            )
        );
    END IF;
    
    -- Prevent organizer status changes by non-admins
    IF OLD.is_organizer IS DISTINCT FROM NEW.is_organizer THEN
        IF NOT auth.is_admin() AND auth.uid() != NEW.user_id THEN
            RAISE EXCEPTION 'Access denied: Cannot change organizer status';
        END IF;
    END IF;
    
    -- Prevent verification status changes by non-admins
    IF OLD.is_verified IS DISTINCT FROM NEW.is_verified THEN
        IF NOT auth.is_admin() THEN
            RAISE EXCEPTION 'Access denied: Cannot change verification status';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply profile validation trigger
CREATE TRIGGER profile_security_validation
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION validate_profile_security();

-- =====================================================
-- EVENT SECURITY TRIGGERS
-- =====================================================

-- Function to validate event changes
CREATE OR REPLACE FUNCTION validate_event_security()
RETURNS TRIGGER AS $$
DECLARE
    event_owner_id UUID;
BEGIN
    -- Get the event owner
    SELECT p.user_id INTO event_owner_id
    FROM profiles p
    WHERE p.id = NEW.organizer_id;
    
    -- Prevent non-organizers from creating events
    IF TG_OP = 'INSERT' THEN
        IF NOT auth.is_verified_organizer(event_owner_id) AND NOT auth.is_admin() THEN
            RAISE EXCEPTION 'Access denied: Must be a verified organizer to create events';
        END IF;
        
        -- Check rate limiting for event creation
        IF NOT auth.check_rate_limit(event_owner_id, 'event_creation', 5, INTERVAL '1 hour') THEN
            RAISE EXCEPTION 'Rate limit exceeded: Too many events created recently';
        END IF;
    END IF;
    
    -- Prevent unauthorized status changes
    IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        -- Only organizer or admin can change status
        IF NOT auth.can_edit_event(NEW.id) THEN
            RAISE EXCEPTION 'Access denied: Cannot change event status';
        END IF;
        
        -- Log status changes
        PERFORM auth.log_security_event(
            'event_status_change',
            auth.uid(),
            'event',
            NEW.id,
            'change_status',
            TRUE,
            jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status
            )
        );
    END IF;
    
    -- Prevent organizer changes by non-admins
    IF TG_OP = 'UPDATE' AND OLD.organizer_id IS DISTINCT FROM NEW.organizer_id THEN
        IF NOT auth.is_admin() THEN
            RAISE EXCEPTION 'Access denied: Cannot change event organizer';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply event validation trigger
CREATE TRIGGER event_security_validation
    BEFORE INSERT OR UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION validate_event_security();

-- =====================================================
-- ATTENDANCE SECURITY TRIGGERS
-- =====================================================

-- Function to validate attendance changes
CREATE OR REPLACE FUNCTION validate_attendance_security()
RETURNS TRIGGER AS $$
BEGIN
    -- Rate limiting for attendance changes
    IF NOT auth.check_rate_limit(NEW.user_id, 'attendance_change', 10, INTERVAL '1 minute') THEN
        RAISE EXCEPTION 'Rate limit exceeded: Too many attendance changes';
    END IF;
    
    -- Ensure user can only manage their own attendance
    IF NEW.user_id != auth.uid() AND NOT auth.is_admin() THEN
        RAISE EXCEPTION 'Access denied: Can only manage own attendance';
    END IF;
    
    -- Check if user can view the event they're trying to attend
    IF NOT auth.can_view_event(NEW.event_id, NEW.user_id) THEN
        RAISE EXCEPTION 'Access denied: Cannot attend private event without invitation';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply attendance validation trigger
CREATE TRIGGER attendance_security_validation
    BEFORE INSERT OR UPDATE ON event_attendance
    FOR EACH ROW
    EXECUTE FUNCTION validate_attendance_security();

-- =====================================================
-- IMAGE SECURITY TRIGGERS
-- =====================================================

-- Function to validate image uploads
CREATE OR REPLACE FUNCTION validate_image_security()
RETURNS TRIGGER AS $$
BEGIN
    -- Rate limiting for image uploads
    IF TG_OP = 'INSERT' THEN
        IF NOT auth.check_rate_limit(auth.uid(), 'image_upload', 20, INTERVAL '1 hour') THEN
            RAISE EXCEPTION 'Rate limit exceeded: Too many images uploaded';
        END IF;
    END IF;
    
    -- Ensure user can upload to this event
    IF NOT auth.is_event_organizer(NEW.event_id) AND NOT auth.is_admin() THEN
        RAISE EXCEPTION 'Access denied: Can only upload images to own events';
    END IF;
    
    -- Validate image URL format
    IF NEW.url !~ '^https?://' THEN
        RAISE EXCEPTION 'Invalid image URL format';
    END IF;
    
    -- Auto-set primary image if this is the first image
    IF TG_OP = 'INSERT' AND NOT EXISTS (
        SELECT 1 FROM event_images 
        WHERE event_id = NEW.event_id AND is_primary = TRUE
    ) THEN
        NEW.is_primary := TRUE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply image validation trigger
CREATE TRIGGER image_security_validation
    BEFORE INSERT OR UPDATE ON event_images
    FOR EACH ROW
    EXECUTE FUNCTION validate_image_security();

-- =====================================================
-- NOTIFICATION SECURITY TRIGGERS
-- =====================================================

-- Function to validate notification creation
CREATE OR REPLACE FUNCTION validate_notification_security()
RETURNS TRIGGER AS $$
BEGIN
    -- Only allow system, organizers, or admins to create notifications
    IF TG_OP = 'INSERT' THEN
        IF auth.role() != 'service_role' AND NOT auth.is_admin() THEN
            -- Check if it's an event notification from the organizer
            IF NEW.event_id IS NOT NULL THEN
                IF NOT auth.is_event_organizer(NEW.event_id) THEN
                    RAISE EXCEPTION 'Access denied: Cannot create notifications for events you do not organize';
                END IF;
            ELSE
                -- Non-event notifications require admin privileges
                RAISE EXCEPTION 'Access denied: System notifications require admin privileges';
            END IF;
        END IF;
    END IF;
    
    -- Prevent notification spam
    IF TG_OP = 'INSERT' THEN
        IF EXISTS (
            SELECT 1 FROM notifications 
            WHERE user_id = NEW.user_id 
            AND title = NEW.title 
            AND created_at > NOW() - INTERVAL '1 minute'
        ) THEN
            RAISE EXCEPTION 'Duplicate notification prevented';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply notification validation trigger
CREATE TRIGGER notification_security_validation
    BEFORE INSERT ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION validate_notification_security();

-- =====================================================
-- SECURITY MONITORING VIEWS
-- =====================================================

-- View for recent security events
CREATE OR REPLACE VIEW admin.recent_security_events AS
SELECT 
    sa.id,
    sa.event_type,
    sa.user_id,
    p.username,
    p.first_name || ' ' || p.last_name AS full_name,
    sa.resource_type,
    sa.resource_id,
    sa.action_type,
    sa.success,
    sa.details,
    sa.ip_address,
    sa.created_at
FROM security_audit sa
LEFT JOIN profiles p ON sa.user_id = p.user_id
WHERE sa.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY sa.created_at DESC;

-- View for failed security events
CREATE OR REPLACE VIEW admin.failed_security_events AS
SELECT 
    sa.id,
    sa.event_type,
    sa.user_id,
    p.username,
    sa.resource_type,
    sa.action_type,
    sa.details,
    sa.ip_address,
    sa.created_at,
    COUNT(*) OVER (
        PARTITION BY sa.user_id, sa.event_type 
        ORDER BY sa.created_at 
        RANGE BETWEEN INTERVAL '1 hour' PRECEDING AND CURRENT ROW
    ) AS recent_failures
FROM security_audit sa
LEFT JOIN profiles p ON sa.user_id = p.user_id
WHERE sa.success = FALSE
ORDER BY sa.created_at DESC;

-- View for user role summary
CREATE OR REPLACE VIEW admin.user_roles_summary AS
SELECT 
    p.user_id,
    p.username,
    p.first_name || ' ' || p.last_name AS full_name,
    p.is_organizer,
    p.is_verified,
    COALESCE(p.social_links->>'role', 'user') AS role,
    p.created_at,
    p.updated_at,
    -- Event statistics
    COUNT(e.id) AS events_created,
    COUNT(ea.id) AS events_attended
FROM profiles p
LEFT JOIN events e ON p.id = e.organizer_id
LEFT JOIN event_attendance ea ON p.user_id = ea.user_id
GROUP BY p.user_id, p.username, p.first_name, p.last_name, 
         p.is_organizer, p.is_verified, p.social_links, 
         p.created_at, p.updated_at;

-- =====================================================
-- CLEANUP AND MAINTENANCE FUNCTIONS
-- =====================================================

-- Function to clean up old audit logs
CREATE OR REPLACE FUNCTION admin.cleanup_audit_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM security_audit 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to analyze security patterns
CREATE OR REPLACE FUNCTION admin.analyze_security_patterns(hours_back INTEGER DEFAULT 24)
RETURNS TABLE (
    pattern_type TEXT,
    user_id UUID,
    username TEXT,
    event_count BIGINT,
    risk_level TEXT
) AS $$
BEGIN
    RETURN QUERY
    -- Analyze suspicious login patterns, excessive actions, etc.
    SELECT 
        'excessive_events'::TEXT,
        p.user_id,
        p.username,
        COUNT(e.id)::BIGINT,
        CASE 
            WHEN COUNT(e.id) > 10 THEN 'HIGH'
            WHEN COUNT(e.id) > 5 THEN 'MEDIUM'
            ELSE 'LOW'
        END::TEXT
    FROM profiles p
    JOIN events e ON p.id = e.organizer_id
    WHERE e.created_at >= NOW() - INTERVAL '1 hour' * hours_back
    GROUP BY p.user_id, p.username
    HAVING COUNT(e.id) > 2
    
    UNION ALL
    
    SELECT 
        'excessive_attendance'::TEXT,
        ea.user_id,
        p.username,
        COUNT(ea.id)::BIGINT,
        CASE 
            WHEN COUNT(ea.id) > 50 THEN 'HIGH'
            WHEN COUNT(ea.id) > 20 THEN 'MEDIUM'
            ELSE 'LOW'
        END::TEXT
    FROM event_attendance ea
    JOIN profiles p ON ea.user_id = p.user_id
    WHERE ea.created_at >= NOW() - INTERVAL '1 hour' * hours_back
    GROUP BY ea.user_id, p.username
    HAVING COUNT(ea.id) > 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANTS AND PERMISSIONS
-- =====================================================

-- Enable RLS on audit table
ALTER TABLE security_audit ENABLE ROW LEVEL SECURITY;

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs" ON security_audit
    FOR SELECT USING (auth.is_admin());

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs" ON security_audit
    FOR SELECT USING (user_id = auth.uid());

-- Grant permissions on admin views
GRANT SELECT ON admin.recent_security_events TO authenticated;
GRANT SELECT ON admin.failed_security_events TO authenticated;
GRANT SELECT ON admin.user_roles_summary TO authenticated;

-- Note: Access to these views is still controlled by the underlying table policies
