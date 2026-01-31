-- Message Templates for Common Guest Communications
-- Allows captains to save and reuse common messages

CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  category TEXT,
  is_default BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX idx_message_templates_owner ON message_templates(owner_id);
CREATE INDEX idx_message_templates_category ON message_templates(owner_id, category);

-- Comments
COMMENT ON TABLE message_templates IS 'Reusable message templates for guest communications';
COMMENT ON COLUMN message_templates.category IS 'Template category: reminder, weather, instructions, cancellation, general';
COMMENT ON COLUMN message_templates.use_count IS 'Number of times this template has been used';
COMMENT ON COLUMN message_templates.body IS 'Template body with optional placeholders: {guest_name}, {date}, {time}, {vessel}, {meeting_spot}';
