-- Add calendar token to profiles for iCal export
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS calendar_token TEXT UNIQUE;

-- Generate random tokens for existing profiles
UPDATE profiles 
SET calendar_token = encode(gen_random_bytes(32), 'hex')
WHERE calendar_token IS NULL;

-- Create index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_profiles_calendar_token ON profiles(calendar_token);

-- Function to generate calendar token on profile creation
CREATE OR REPLACE FUNCTION generate_calendar_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.calendar_token IS NULL THEN
    NEW.calendar_token = encode(gen_random_bytes(32), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate token
DROP TRIGGER IF EXISTS set_calendar_token ON profiles;
CREATE TRIGGER set_calendar_token
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_calendar_token();

COMMENT ON COLUMN profiles.calendar_token IS 'Secret token for iCal calendar feed export';
