-- Add Event Moderation Fields
-- ============================
-- Add missing moderation fields to events table for admin functionality

-- Add moderation fields to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged', 'under_review')),
ADD COLUMN IF NOT EXISTS moderation_note TEXT,
ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS venue VARCHAR(200);

-- Update status enum to include admin statuses
ALTER TYPE event_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE event_status ADD VALUE IF NOT EXISTS 'approved';
ALTER TYPE event_status ADD VALUE IF NOT EXISTS 'rejected';

-- Create indexes for moderation fields
CREATE INDEX IF NOT EXISTS idx_events_moderation_status ON events(moderation_status);
CREATE INDEX IF NOT EXISTS idx_events_moderated_by ON events(moderated_by);
CREATE INDEX IF NOT EXISTS idx_events_moderated_at ON events(moderated_at);

-- Map location_name to venue for backwards compatibility
UPDATE events 
SET venue = location_name 
WHERE venue IS NULL AND location_name IS NOT NULL;

-- Map old statuses to new moderation system
UPDATE events 
SET 
    moderation_status = CASE 
        WHEN status = 'published' THEN 'approved'
        WHEN status = 'draft' THEN 'pending'
        ELSE 'pending'
    END
WHERE moderation_status = 'pending';

-- Create function to auto-update moderation timestamps
CREATE OR REPLACE FUNCTION update_moderation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.moderation_status IS DISTINCT FROM NEW.moderation_status THEN
        NEW.moderated_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update moderation timestamp
DROP TRIGGER IF EXISTS update_event_moderation_timestamp ON events;
CREATE TRIGGER update_event_moderation_timestamp
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_moderation_timestamp();
