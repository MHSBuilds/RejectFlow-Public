-- Add branding to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS company_logo_url TEXT,
ADD COLUMN IF NOT EXISTS company_primary_color VARCHAR(7) DEFAULT '#3B82F6';

-- Create organization settings for HR integration
CREATE TABLE IF NOT EXISTS organization_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_name VARCHAR(255) NOT NULL,
  api_key UUID DEFAULT uuid_generate_v4() UNIQUE,
  webhook_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organization_settings(id);

-- Enable RLS
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own organization" 
ON organization_settings FOR SELECT 
USING (id IN (SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()));

-- Track monthly email usage
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  emails_sent INTEGER DEFAULT 0,
  emails_generated INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- Enable RLS
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own usage" 
ON user_usage FOR ALL 
USING (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_user_usage_user_month ON user_usage(user_id, month);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_interview_feedback_candidate_id ON interview_feedback(candidate_id);
CREATE INDEX IF NOT EXISTS idx_rejection_emails_candidate_id ON rejection_emails(candidate_id);
CREATE INDEX IF NOT EXISTS idx_rejection_emails_feedback_id ON rejection_emails(feedback_id);
CREATE INDEX IF NOT EXISTS idx_rejection_emails_status ON rejection_emails(status);
CREATE INDEX IF NOT EXISTS idx_candidates_user_created ON candidates(user_id, created_at DESC);