-- RaveTracker v3.0 - Security & Monitoring Tables
-- ================================================
-- Database tables for security monitoring, IP blocking, and threat detection

-- =====================================================
-- SECURITY LOGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS security_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Event information
  event_type VARCHAR(50) NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  email_attempted VARCHAR(320),
  code_attempted VARCHAR(12),
  success BOOLEAN NOT NULL DEFAULT false,
  
  -- Additional details
  details JSONB DEFAULT '{}',
  risk_score DECIMAL(3,2) DEFAULT 0.0,
  
  -- Metadata
  country_code CHAR(2),
  is_suspicious BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT security_logs_risk_score_range CHECK (risk_score >= 0.0 AND risk_score <= 1.0),
  CONSTRAINT security_logs_event_type_valid CHECK (
    event_type IN ('code_validation', 'login_attempt', 'registration', 'admin_action', 'rate_limit_exceeded')
  ),
  CONSTRAINT security_logs_email_format CHECK (
    email_attempted IS NULL OR 
    email_attempted ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
  )
);

-- Indexes for security_logs table
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_ip ON security_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_security_logs_success ON security_logs(success);
CREATE INDEX IF NOT EXISTS idx_security_logs_suspicious ON security_logs(is_suspicious) WHERE is_suspicious = true;
CREATE INDEX IF NOT EXISTS idx_security_logs_ip_time ON security_logs(ip_address, created_at);
CREATE INDEX IF NOT EXISTS idx_security_logs_email_time ON security_logs(email_attempted, created_at) 
  WHERE email_attempted IS NOT NULL;

-- =====================================================
-- IP BLOCKS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS ip_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- IP information
  ip_address INET NOT NULL,
  reason TEXT NOT NULL,
  
  -- Block management
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Relations
  blocked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  unblocked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unblocked_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT ip_blocks_reason_length CHECK (char_length(reason) >= 5 AND char_length(reason) <= 500),
  CONSTRAINT ip_blocks_unblock_consistency CHECK (
    (is_active = true AND unblocked_by IS NULL AND unblocked_at IS NULL) OR
    (is_active = false AND unblocked_by IS NOT NULL AND unblocked_at IS NOT NULL)
  ),
  CONSTRAINT ip_blocks_expires_future CHECK (
    expires_at IS NULL OR expires_at > created_at
  )
);

-- Indexes for ip_blocks table
CREATE INDEX IF NOT EXISTS idx_ip_blocks_ip ON ip_blocks(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_blocks_active ON ip_blocks(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ip_blocks_expires ON ip_blocks(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ip_blocks_created_at ON ip_blocks(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ip_blocks_active_unique ON ip_blocks(ip_address) 
  WHERE is_active = true;

-- =====================================================
-- EMAIL BLOCKS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS email_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Email information
  email VARCHAR(320) NOT NULL,
  reason TEXT NOT NULL,
  
  -- Block management
  is_active BOOLEAN DEFAULT true,
  
  -- Relations
  blocked_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  unblocked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unblocked_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT email_blocks_email_format CHECK (
    email ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
  ),
  CONSTRAINT email_blocks_reason_length CHECK (char_length(reason) >= 5 AND char_length(reason) <= 500),
  CONSTRAINT email_blocks_unblock_consistency CHECK (
    (is_active = true AND unblocked_by IS NULL AND unblocked_at IS NULL) OR
    (is_active = false AND unblocked_by IS NOT NULL AND unblocked_at IS NOT NULL)
  )
);

-- Indexes for email_blocks table
CREATE INDEX IF NOT EXISTS idx_email_blocks_email ON email_blocks(email);
CREATE INDEX IF NOT EXISTS idx_email_blocks_active ON email_blocks(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_email_blocks_created_at ON email_blocks(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_blocks_active_unique ON email_blocks(email) 
  WHERE is_active = true;

-- =====================================================
-- SECURITY SETTINGS TABLE (separate from system_settings)
-- =====================================================

CREATE TABLE IF NOT EXISTS security_settings (
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
  CONSTRAINT security_settings_key_format CHECK (
    char_length(setting_key) >= 3 AND
    setting_key ~ '^[a-z_]+$'
  )
);

-- Indexes for security_settings table
CREATE INDEX IF NOT EXISTS idx_security_settings_key ON security_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_security_settings_updated_by ON security_settings(updated_by);

-- =====================================================
-- SECURITY FUNCTIONS
-- =====================================================

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_event_type VARCHAR(50),
  p_ip_address INET,
  p_user_agent TEXT DEFAULT NULL,
  p_email_attempted VARCHAR DEFAULT NULL,
  p_code_attempted VARCHAR DEFAULT NULL,
  p_success BOOLEAN DEFAULT false,
  p_details JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  event_id UUID;
  risk_score DECIMAL(3,2) DEFAULT 0.0;
  is_suspicious BOOLEAN DEFAULT false;
BEGIN
  -- Calculate risk score based on event type and success
  risk_score := CASE 
    WHEN p_success = false AND p_event_type = 'code_validation' THEN 0.3
    WHEN p_event_type = 'rate_limit_exceeded' THEN 0.7
    WHEN p_user_agent LIKE '%curl%' OR p_user_agent LIKE '%bot%' THEN 0.8
    ELSE 0.1
  END;
  
  -- Mark as suspicious if risk score is high
  is_suspicious := risk_score >= 0.5;
  
  -- Insert security log entry
  INSERT INTO security_logs (
    event_type,
    ip_address,
    user_agent,
    email_attempted,
    code_attempted,
    success,
    details,
    risk_score,
    is_suspicious,
    created_at
  ) VALUES (
    p_event_type,
    p_ip_address,
    p_user_agent,
    p_email_attempted,
    p_code_attempted,
    p_success,
    p_details,
    risk_score,
    is_suspicious,
    NOW()
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if IP is blocked
CREATE OR REPLACE FUNCTION is_ip_blocked(p_ip_address INET)
RETURNS BOOLEAN AS $$
DECLARE
  block_exists BOOLEAN := false;
BEGIN
  -- Check for active blocks
  SELECT EXISTS (
    SELECT 1 FROM ip_blocks 
    WHERE ip_address = p_ip_address 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > NOW())
  ) INTO block_exists;
  
  -- Auto-expire expired blocks
  UPDATE ip_blocks 
  SET is_active = false 
  WHERE ip_address = p_ip_address 
  AND is_active = true 
  AND expires_at IS NOT NULL 
  AND expires_at <= NOW();
  
  RETURN block_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if email is blocked
CREATE OR REPLACE FUNCTION is_email_blocked(p_email VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM email_blocks 
    WHERE email = p_email 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-block IP based on failed attempts
CREATE OR REPLACE FUNCTION check_and_auto_block_ip(p_ip_address INET)
RETURNS BOOLEAN AS $$
DECLARE
  recent_failures INTEGER;
  blocked BOOLEAN := false;
BEGIN
  -- Count failed attempts in last hour
  SELECT COUNT(*) INTO recent_failures
  FROM security_logs 
  WHERE ip_address = p_ip_address 
  AND success = false 
  AND created_at > NOW() - INTERVAL '1 hour';
  
  -- Auto-block if threshold exceeded (20 failures in 1 hour)
  IF recent_failures >= 20 THEN
    INSERT INTO ip_blocks (
      ip_address,
      reason,
      blocked_by,
      expires_at,
      created_at
    ) VALUES (
      p_ip_address,
      'Automatic block: Too many failed attempts',
      NULL, -- System block
      NOW() + INTERVAL '24 hours',
      NOW()
    );
    
    blocked := true;
  END IF;
  
  RETURN blocked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- DEFAULT SECURITY SETTINGS
-- =====================================================

-- Insert default security settings
INSERT INTO security_settings (setting_key, setting_value, updated_by, created_at, updated_at)
VALUES 
  ('rate_limit_config', '{"thresholds": {"codeAttempts": {"perMinute": 10, "perHour": 50, "perDay": 200}, "ipAttempts": {"perMinute": 5, "perHour": 20, "perDay": 100}, "emailAttempts": {"perHour": 10, "perDay": 30}}}', NULL, NOW(), NOW()),
  ('emergency_lockdown', '{"enabled": false, "reason": "", "activatedAt": null, "activatedBy": null}', NULL, NOW(), NOW()),
  ('security_monitoring', '{"autoBlock": true, "alertThreshold": 0.7, "cleanupDays": 30}', NULL, NOW(), NOW())
ON CONFLICT (setting_key) DO NOTHING;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS on all security tables
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;

-- Security logs policies
CREATE POLICY "Admins can view all security logs" ON security_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "System can insert security logs" ON security_logs
  FOR INSERT WITH CHECK (true);

-- IP blocks policies
CREATE POLICY "Admins can manage IP blocks" ON ip_blocks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Email blocks policies
CREATE POLICY "Admins can manage email blocks" ON email_blocks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- System settings policies
CREATE POLICY "Admins can manage security settings" ON security_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- CLEANUP FUNCTIONS
-- =====================================================

-- Function to clean up old security logs (keep 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_security_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM security_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENT ON TABLES
-- =====================================================

COMMENT ON TABLE security_logs IS 'Comprehensive log of all security events including code validation attempts, logins, and suspicious activities';
COMMENT ON TABLE ip_blocks IS 'IP addresses that are blocked from accessing the system';
COMMENT ON TABLE email_blocks IS 'Email addresses that are blocked from registration or login';
COMMENT ON TABLE security_settings IS 'Security-specific configuration settings for monitoring and rate limiting';
