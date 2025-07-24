-- Admin Panel Row Level Security Policies
-- =========================================
-- Secure admin access with comprehensive RLS policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reports ENABLE ROW LEVEL SECURITY;

-- =============================================
-- HELPER FUNCTIONS (only the ones not already defined)
-- =============================================

-- Function to check if user is organizer or admin
CREATE OR REPLACE FUNCTION is_organizer_or_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'organizer')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns the profile
CREATE OR REPLACE FUNCTION owns_profile(profile_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN auth.uid() = profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns the event
CREATE OR REPLACE FUNCTION owns_event(event_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM events 
    WHERE id = event_id 
    AND organizer_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- PROFILES TABLE POLICIES
-- =============================================

-- Admins can view all profiles
CREATE POLICY "admin_profiles_select" ON profiles
FOR SELECT
TO authenticated
USING (is_admin());

-- Admins can update all profiles (for user management)
CREATE POLICY "admin_profiles_update" ON profiles
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Users can view their own profile
CREATE POLICY "user_profile_select" ON profiles
FOR SELECT
TO authenticated
USING (owns_profile(id));

-- Users can update their own profile (admins can update role/status)
CREATE POLICY "user_profile_update" ON profiles
FOR UPDATE
TO authenticated
USING (owns_profile(id) OR is_admin())
WITH CHECK (owns_profile(id) OR is_admin());-- Users can insert their own profile
CREATE POLICY "user_profile_insert" ON profiles
FOR INSERT
TO authenticated
WITH CHECK (owns_profile(id));

-- Organizers can view limited profile data for event management
CREATE POLICY "organizer_profiles_limited_select" ON profiles
FOR SELECT
TO authenticated
USING (
  is_organizer_or_admin()
  AND (
    -- Only basic info needed for event management
    true
  )
);

-- =============================================
-- EVENTS TABLE POLICIES
-- =============================================

-- Public can view approved events
CREATE POLICY "public_events_select" ON events
FOR SELECT
TO authenticated
USING (status = 'approved' OR organizer_id = auth.uid() OR is_organizer_or_admin());

-- Admins can view all events
CREATE POLICY "admin_events_select" ON events
FOR SELECT
TO authenticated
USING (is_admin());

-- Admins can update all events (for moderation)
CREATE POLICY "admin_events_update" ON events
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Admins can delete events
CREATE POLICY "admin_events_delete" ON events
FOR DELETE
TO authenticated
USING (is_admin());

-- Organizers can view events they organize
CREATE POLICY "organizer_events_select" ON events
FOR SELECT
TO authenticated
USING (organizer_id = auth.uid() OR is_organizer_or_admin());

-- Users can create events (becomes organizer automatically)
CREATE POLICY "user_events_insert" ON events
FOR INSERT
TO authenticated
WITH CHECK (organizer_id = auth.uid());

-- Event organizers can update their own events
CREATE POLICY "organizer_events_update" ON events
FOR UPDATE
TO authenticated
USING (organizer_id = auth.uid())
WITH CHECK (organizer_id = auth.uid());

-- Event organizers can delete their own events
CREATE POLICY "organizer_events_delete" ON events
FOR DELETE
TO authenticated
USING (organizer_id = auth.uid() OR is_admin());

-- =============================================
-- EVENT_ATTENDANCE TABLE POLICIES
-- =============================================

-- Users can view their own attendance
CREATE POLICY "user_attendance_select" ON event_attendance
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Event organizers can view attendance for their events
CREATE POLICY "organizer_attendance_select" ON event_attendance
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = event_attendance.event_id 
    AND events.organizer_id = auth.uid()
  )
  OR is_organizer_or_admin()
);

-- Admins can view all attendance
CREATE POLICY "admin_attendance_select" ON event_attendance
FOR SELECT
TO authenticated
USING (is_admin());

-- Users can manage their own attendance
CREATE POLICY "user_attendance_insert" ON event_attendance
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_attendance_delete" ON event_attendance
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Admins can manage all attendance
CREATE POLICY "admin_attendance_all" ON event_attendance
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- =============================================
-- EVENT_REPORTS TABLE POLICIES
-- =============================================

-- Users can create reports
CREATE POLICY "user_reports_insert" ON event_reports
FOR INSERT
TO authenticated
WITH CHECK (reporter_id = auth.uid());

-- Users can view their own reports
CREATE POLICY "user_reports_select" ON event_reports
FOR SELECT
TO authenticated
USING (reporter_id = auth.uid());

-- Admins and organizers can view all reports
CREATE POLICY "admin_reports_select" ON event_reports
FOR SELECT
TO authenticated
USING (is_organizer_or_admin());

-- Event organizers can view reports for their events
CREATE POLICY "organizer_reports_select" ON event_reports
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = event_reports.event_id 
    AND events.organizer_id = auth.uid()
  )
);

-- Admins can update and delete reports
CREATE POLICY "admin_reports_update" ON event_reports
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "admin_reports_delete" ON event_reports
FOR DELETE
TO authenticated
USING (is_admin());

-- =============================================
-- ADMIN AUDIT LOG TABLE
-- =============================================

-- Create audit log table for admin actions
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  action varchar(100) NOT NULL,
  target_type varchar(50) NOT NULL, -- 'user', 'event', 'report', etc.
  target_id uuid NOT NULL,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit log
CREATE POLICY "admin_audit_select" ON admin_audit_log
FOR SELECT
TO authenticated
USING (is_admin());

-- Only admins can insert audit log entries
CREATE POLICY "admin_audit_insert" ON admin_audit_log
FOR INSERT
TO authenticated
WITH CHECK (is_admin() AND admin_id = auth.uid());

-- =============================================
-- ADMIN STATISTICS VIEWS
-- =============================================

-- Create secure view for admin statistics
CREATE OR REPLACE VIEW admin_user_stats AS
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE role = 'admin') as admin_count,
  COUNT(*) FILTER (WHERE role = 'organizer') as organizer_count,
  COUNT(*) FILTER (WHERE role = 'user') as user_count,
  COUNT(*) FILTER (WHERE status = 'active') as active_count,
  COUNT(*) FILTER (WHERE status = 'suspended') as suspended_count,
  COUNT(*) FILTER (WHERE status = 'banned') as banned_count,
  COUNT(*) FILTER (WHERE created_at >= now() - interval '7 days') as new_this_week,
  COUNT(*) FILTER (WHERE created_at >= now() - interval '30 days') as new_this_month,
  COUNT(*) FILTER (WHERE last_sign_in_at >= now() - interval '7 days') as active_this_week
FROM profiles;

-- Grant access to admin view
GRANT SELECT ON admin_user_stats TO authenticated;

-- Create secure view for admin event statistics
CREATE OR REPLACE VIEW admin_event_stats AS
SELECT 
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
  COUNT(*) FILTER (WHERE moderation_status = 'pending') as pending_moderation,
  COUNT(*) FILTER (WHERE moderation_status = 'flagged') as flagged_count,
  COUNT(*) FILTER (WHERE created_at >= now() - interval '7 days') as new_this_week,
  COUNT(*) FILTER (WHERE created_at >= now() - interval '30 days') as new_this_month,
  AVG((SELECT COUNT(*) FROM event_attendance WHERE event_attendance.event_id = events.id)) as avg_attendance
FROM events;

-- Grant access to admin event stats view
GRANT SELECT ON admin_event_stats TO authenticated;

-- =============================================
-- ADMIN FUNCTIONS
-- =============================================

-- Function to bulk update user roles (admin only)
CREATE OR REPLACE FUNCTION admin_bulk_update_user_roles(
  user_ids uuid[],
  new_role varchar(20)
)
RETURNS void AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Validate role
  IF new_role NOT IN ('admin', 'organizer', 'user') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;

  -- Update user roles
  UPDATE profiles 
  SET 
    role = new_role,
    updated_at = now()
  WHERE id = ANY(user_ids);

  -- Log the action
  INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, new_values)
  SELECT 
    auth.uid(),
    'bulk_role_update',
    'user',
    unnest(user_ids),
    jsonb_build_object('role', new_role)
  ;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to bulk update user statuses (admin only)
CREATE OR REPLACE FUNCTION admin_bulk_update_user_status(
  user_ids uuid[],
  new_status varchar(20)
)
RETURNS void AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Validate status
  IF new_status NOT IN ('active', 'suspended', 'banned') THEN
    RAISE EXCEPTION 'Invalid status: %', new_status;
  END IF;

  -- Update user statuses
  UPDATE profiles 
  SET 
    status = new_status,
    updated_at = now()
  WHERE id = ANY(user_ids);

  -- Log the action
  INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, new_values)
  SELECT 
    auth.uid(),
    'bulk_status_update',
    'user',
    unnest(user_ids),
    jsonb_build_object('status', new_status)
  ;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to moderate event (admin/organizer only)
CREATE OR REPLACE FUNCTION moderate_event(
  event_id uuid,
  new_status varchar(20),
  new_moderation_status varchar(20),
  moderation_note text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  old_event events%ROWTYPE;
BEGIN
  -- Check if user is admin or organizer
  IF NOT is_organizer_or_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin or organizer privileges required';
  END IF;

  -- Get current event data
  SELECT * INTO old_event FROM events WHERE id = event_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found: %', event_id;
  END IF;

  -- Update event
  UPDATE events 
  SET 
    status = COALESCE(new_status, status),
    moderation_status = COALESCE(new_moderation_status, moderation_status),
    moderation_note = COALESCE(moderation_note, moderation_note),
    updated_at = now()
  WHERE id = event_id;

  -- Log the action
  INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, old_values, new_values)
  VALUES (
    auth.uid(),
    'event_moderation',
    'event',
    event_id,
    jsonb_build_object(
      'status', old_event.status,
      'moderation_status', old_event.moderation_status
    ),
    jsonb_build_object(
      'status', COALESCE(new_status, old_event.status),
      'moderation_status', COALESCE(new_moderation_status, old_event.moderation_status),
      'moderation_note', moderation_note
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_last_sign_in ON profiles(last_sign_in_at);

CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_moderation_status ON events(moderation_status);
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);

CREATE INDEX IF NOT EXISTS idx_event_attendance_user_id ON event_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_event_attendance_event_id ON event_attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendance_created_at ON event_attendance(created_at);

CREATE INDEX IF NOT EXISTS idx_event_reports_event_id ON event_reports(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reports_reporter_id ON event_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_event_reports_created_at ON event_reports(created_at);

CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON admin_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_target_type ON admin_audit_log(target_type);

-- =============================================
-- GRANTS AND PERMISSIONS
-- =============================================

-- Grant completed successfully
