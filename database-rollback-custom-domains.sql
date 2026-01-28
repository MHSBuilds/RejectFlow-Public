-- ============================================================
-- Rollback Custom Email Domain Fields
-- ============================================================
-- This removes the custom domain fields that were incorrectly added
-- and keeps only the HR Portal API fields
-- ============================================================

-- Remove custom email domain fields (these are not needed for HR Portal API)
ALTER TABLE user_profiles 
DROP COLUMN IF EXISTS custom_email_domain,
DROP COLUMN IF EXISTS custom_email_verified,
DROP COLUMN IF EXISTS custom_sender_email;

-- Keep these fields for HR Portal API integration:
-- - subscription_tier (keep)
-- - hr_portal_api_enabled (keep) 
-- - hr_portal_api_key (keep)

-- Remove the custom domain index
DROP INDEX IF EXISTS idx_user_profiles_subscription_tier;

-- Keep the API key index
-- idx_user_profiles_api_key (keep)

-- ============================================================
-- VERIFICATION
-- ============================================================

-- Verify custom domain columns were removed
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_profiles'
AND column_name IN (
  'custom_email_domain',
  'custom_email_verified', 
  'custom_sender_email'
);
-- Should return no rows

-- Verify HR Portal API columns still exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_profiles'
AND column_name IN (
  'subscription_tier',
  'hr_portal_api_enabled',
  'hr_portal_api_key'
);
-- Should return 3 rows
