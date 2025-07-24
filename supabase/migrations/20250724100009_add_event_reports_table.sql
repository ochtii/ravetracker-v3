-- Add Event Reports Table
-- =======================
-- Add missing event_reports table for content moderation

-- Create event_reports table
CREATE TABLE IF NOT EXISTS event_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Report Details
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Report Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    admin_notes TEXT,
    resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    UNIQUE(event_id, reporter_id), -- Prevent duplicate reports from same user
    CHECK (reason IN (
        'inappropriate_content',
        'spam',
        'harassment',
        'false_information',
        'copyright_violation',
        'illegal_activity',
        'offensive_language',
        'duplicate_event',
        'other'
    ))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_reports_event_id ON event_reports(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reports_reporter_id ON event_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_event_reports_status ON event_reports(status);
CREATE INDEX IF NOT EXISTS idx_event_reports_created_at ON event_reports(created_at);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_event_reports_updated_at 
    BEFORE UPDATE ON event_reports 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (will be configured in admin RLS policies)
ALTER TABLE event_reports ENABLE ROW LEVEL SECURITY;
