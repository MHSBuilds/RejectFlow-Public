-- ============================================================
-- Email Infrastructure and Pricing Redesign - Database Migration
-- ============================================================
-- This migration adds support for:
-- 1. Custom email domains (Professional/Enterprise plans)
-- 2. HR Portal API integration (Starter+ plans)
-- 3. Subscription tier management
-- ============================================================

-- Add custom email domain fields to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS custom_email_domain VARCHAR(255),
ADD COLUMN IF NOT EXISTS custom_email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS custom_sender_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS hr_portal_api_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS hr_portal_api_key UUID DEFAULT uuid_generate_v4();

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_tier ON user_profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_user_profiles_api_key ON user_profiles(hr_portal_api_key);

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.custom_email_domain IS 'Custom domain verified in Resend (e.g., company.com)';
COMMENT ON COLUMN user_profiles.custom_sender_email IS 'Full sender email (e.g., noreply@company.com)';
COMMENT ON COLUMN user_profiles.subscription_tier IS 'User subscription: free, starter, professional, enterprise';
COMMENT ON COLUMN user_profiles.hr_portal_api_enabled IS 'Whether HR Portal API access is enabled';
COMMENT ON COLUMN user_profiles.hr_portal_api_key IS 'API key for HR portal integration';

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Verify columns were added successfully
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
AND column_name IN (
  'custom_email_domain',
  'custom_email_verified',
  'custom_sender_email',
  'subscription_tier',
  'hr_portal_api_enabled',
  'hr_portal_api_key'
);

-- Verify indexes were created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'user_profiles'
AND indexname IN (
  'idx_user_profiles_subscription_tier',
  'idx_user_profiles_api_key'
);

-- Check existing user_profiles (should show new columns)
SELECT 
  user_id,
  sender_name,
  company_name,
  subscription_tier,
  hr_portal_api_enabled,
  custom_email_verified
FROM user_profiles
LIMIT 5;

-- ============================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================
-- Uncomment and modify the following to test different subscription tiers:

/*
-- Set a test user to Starter plan with HR API enabled
UPDATE user_profiles
SET 
  subscription_tier = 'starter',
  hr_portal_api_enabled = TRUE
WHERE user_id = 'YOUR_USER_ID_HERE';

-- Set a test user to Professional plan with custom domain
UPDATE user_profiles
SET 
  subscription_tier = 'professional',
  hr_portal_api_enabled = TRUE,
  custom_email_domain = 'yourcompany.com',
  custom_sender_email = 'noreply@yourcompany.com',
  custom_email_verified = TRUE
WHERE user_id = 'YOUR_USER_ID_HERE';

-- Set a test user to Enterprise plan
UPDATE user_profiles
SET 
  subscription_tier = 'enterprise',
  hr_portal_api_enabled = TRUE,
  custom_email_domain = 'enterprise.com',
  custom_sender_email = 'hr@enterprise.com',
  custom_email_verified = TRUE
WHERE user_id = 'YOUR_USER_ID_HERE';
*/

-- ============================================================
-- ROLLBACK (if needed)
-- ============================================================
/*
-- WARNING: This will remove all data in the new columns!
-- Only use if you need to rollback the migration.

-- Remove indexes
DROP INDEX IF EXISTS idx_user_profiles_subscription_tier;
DROP INDEX IF EXISTS idx_user_profiles_api_key;

-- Remove columns
ALTER TABLE user_profiles 
DROP COLUMN IF EXISTS custom_email_domain,
DROP COLUMN IF EXISTS custom_email_verified,
DROP COLUMN IF EXISTS custom_sender_email,
DROP COLUMN IF EXISTS subscription_tier,
DROP COLUMN IF EXISTS hr_portal_api_enabled,
DROP COLUMN IF EXISTS hr_portal_api_key;
*/


