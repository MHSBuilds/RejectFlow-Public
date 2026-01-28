-- Add HR Portal API fields to user_profiles table
-- (This assumes user_profiles table already exists from database-rls-policies.sql)

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS hr_portal_api_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS hr_portal_api_key UUID DEFAULT uuid_generate_v4();

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_tier ON user_profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_user_profiles_api_key ON user_profiles(hr_portal_api_key);

-- Add comments
COMMENT ON COLUMN user_profiles.subscription_tier IS 'User subscription: free, starter, professional, enterprise';
COMMENT ON COLUMN user_profiles.hr_portal_api_enabled IS 'Whether HR Portal API access is enabled';
COMMENT ON COLUMN user_profiles.hr_portal_api_key IS 'API key for HR portal integration';

-- Verification
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
AND column_name IN (
  'subscription_tier',
  'hr_portal_api_enabled',
  'hr_portal_api_key'
);