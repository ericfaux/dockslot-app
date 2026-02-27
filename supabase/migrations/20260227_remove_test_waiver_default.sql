-- Remove "Test" waiver templates from the database.
--
-- The "Test" waiver was manually created (not seeded by code) and should not
-- exist for any captain account. This migration:
--   1. Deletes any "Test" waiver templates that have NO associated signatures
--      (safe to delete since they were never signed).
--   2. Deactivates any "Test" waiver templates that DO have signatures
--      (preserves audit trail for signed waivers).
--
-- After this migration, new captain accounts start with zero waiver templates.
-- There is no code that auto-creates waiver templates; captains add their own.

-- Step 1: Deactivate "Test" waivers that have associated signatures (preserve audit trail)
UPDATE waiver_templates
SET is_active = FALSE
WHERE LOWER(title) = 'test'
  AND is_active = TRUE
  AND id IN (
    SELECT DISTINCT waiver_template_id FROM waiver_signatures
  );

-- Step 2: Delete "Test" waivers that have NO associated signatures (safe to remove)
DELETE FROM waiver_templates
WHERE LOWER(title) = 'test'
  AND id NOT IN (
    SELECT DISTINCT waiver_template_id FROM waiver_signatures
  );
