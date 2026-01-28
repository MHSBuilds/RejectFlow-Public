-- ============================================================
-- Update Usage Tracking for HR Portal API
-- ============================================================
-- Change from email-based usage to API call-based usage
-- ============================================================

-- Add API calls column to user_usage table
ALTER TABLE user_usage 
ADD COLUMN IF NOT EXISTS api_calls INTEGER DEFAULT 0;

-- Update existing records to set api_calls = emails_sent (for migration)
UPDATE user_usage 
SET api_calls = emails_sent 
WHERE api_calls IS NULL;

-- Add comment
COMMENT ON COLUMN user_usage.api_calls IS 'Number of API calls made this month';

-- ============================================================
-- VERIFICATION
-- ============================================================

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_usage'
AND column_name = 'api_calls';

-- Check existing data
SELECT 
  user_id,
  month,
  emails_sent,
  api_calls,
  emails_generated
FROM user_usage
LIMIT 5;
