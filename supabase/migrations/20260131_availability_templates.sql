-- Create availability templates table for recurring schedules
CREATE TABLE IF NOT EXISTS availability_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  captain_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Template details
  name VARCHAR(100) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  
  -- Weekly schedule (JSONB for flexibility)
  -- Format: { "monday": [{"start": "09:00", "end": "17:00"}], "tuesday": [...], ... }
  weekly_schedule JSONB NOT NULL DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure only one default per captain
  CONSTRAINT one_default_per_captain UNIQUE (captain_id, is_default) WHERE is_default = TRUE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_availability_templates_captain ON availability_templates(captain_id);
CREATE INDEX IF NOT EXISTS idx_availability_templates_default ON availability_templates(captain_id, is_default) WHERE is_default = TRUE;

-- Comments
COMMENT ON TABLE availability_templates IS 'Reusable weekly availability schedules for captains';
COMMENT ON COLUMN availability_templates.weekly_schedule IS 'JSON object with day-of-week keys and time slot arrays';
COMMENT ON COLUMN availability_templates.is_default IS 'Default template applied to new weeks';

-- Function to apply template to a date range
CREATE OR REPLACE FUNCTION apply_availability_template(
  template_id_param UUID,
  start_date_param DATE,
  end_date_param DATE
)
RETURNS INTEGER AS $$
DECLARE
  template_record RECORD;
  current_date DATE;
  day_name TEXT;
  time_slots JSONB;
  slot JSONB;
  slots_created INTEGER := 0;
BEGIN
  -- Get template
  SELECT * INTO template_record
  FROM availability_templates
  WHERE id = template_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found';
  END IF;
  
  -- Loop through date range
  current_date := start_date_param;
  WHILE current_date <= end_date_param LOOP
    -- Get day of week name (lowercase)
    day_name := lower(to_char(current_date, 'Day'));
    day_name := trim(day_name);
    
    -- Get time slots for this day
    time_slots := template_record.weekly_schedule -> day_name;
    
    -- If slots exist for this day, create them
    IF time_slots IS NOT NULL THEN
      FOR slot IN SELECT * FROM jsonb_array_elements(time_slots) LOOP
        -- Insert availability slot (assuming you have an availability_windows table)
        -- Adjust this based on your actual availability schema
        INSERT INTO availability_windows (
          captain_id,
          available_date,
          start_time,
          end_time
        ) VALUES (
          template_record.captain_id,
          current_date,
          (slot->>'start')::TIME,
          (slot->>'end')::TIME
        )
        ON CONFLICT DO NOTHING; -- Don't overwrite existing slots
        
        slots_created := slots_created + 1;
      END LOOP;
    END IF;
    
    current_date := current_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN slots_created;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_availability_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER availability_templates_updated_at
  BEFORE UPDATE ON availability_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_availability_templates_updated_at();
