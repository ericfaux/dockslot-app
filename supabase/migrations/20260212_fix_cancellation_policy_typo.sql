-- Fix typo in cancellation_policy text: "withing" -> "within"
-- The text "Cancel withing 3 days" should read "Cancel within 3 days"

UPDATE profiles
SET cancellation_policy = REPLACE(cancellation_policy, 'withing', 'within')
WHERE cancellation_policy LIKE '%withing%';

UPDATE trip_types
SET cancellation_policy_text = REPLACE(cancellation_policy_text, 'withing', 'within')
WHERE cancellation_policy_text LIKE '%withing%';
