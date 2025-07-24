-- System Settings Table
-- =====================
-- Store system-wide configuration settings

CREATE TABLE IF NOT EXISTS system_settings (
  id integer PRIMARY KEY DEFAULT 1,
  settings jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES profiles(id),
  CONSTRAINT single_settings_row CHECK (id = 1)
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can access system settings
CREATE POLICY "admin_settings_select" ON system_settings
FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "admin_settings_insert" ON system_settings
FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "admin_settings_update" ON system_settings
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Insert default settings
INSERT INTO system_settings (id, settings) VALUES (
  1,
  '{
    "general": {
      "site_name": "RaveTracker",
      "site_description": "The ultimate platform for discovering and organizing rave events",
      "support_email": "support@ravetracker.com",
      "max_events_per_user": 10,
      "require_event_approval": true,
      "allow_public_registration": true,
      "maintenance_mode": false
    },
    "notifications": {
      "email_notifications": true,
      "push_notifications": true,
      "admin_notification_email": "admin@ravetracker.com",
      "notify_on_new_event": true,
      "notify_on_new_user": true,
      "notify_on_report": true
    },
    "security": {
      "max_login_attempts": 5,
      "session_timeout": 30,
      "require_email_verification": true,
      "allow_password_reset": true,
      "two_factor_required": false,
      "min_password_length": 8
    },
    "content": {
      "max_event_description_length": 2000,
      "allowed_image_formats": ["jpg", "jpeg", "png", "webp"],
      "max_image_size_mb": 5,
      "content_moderation": true,
      "auto_moderate_keywords": ["spam", "inappropriate"]
    },
    "integrations": {
      "google_maps_api_key": "",
      "email_service_api_key": "",
      "analytics_tracking_id": "",
      "social_login_enabled": true
    }
  }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON system_settings TO authenticated;
