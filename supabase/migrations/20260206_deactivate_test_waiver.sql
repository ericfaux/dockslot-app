-- Deactivate the "Test" waiver template that was left active in production.
-- Using deactivation (not deletion) to preserve any existing signature references.
UPDATE waiver_templates
SET is_active = FALSE, updated_at = NOW()
WHERE LOWER(title) = 'test' AND is_active = TRUE;
