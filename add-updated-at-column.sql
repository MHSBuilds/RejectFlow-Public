-- SQL script to add updated_at column to rejection_emails table
-- Run this in your Supabase SQL Editor if the column doesn't exist

-- Add updated_at column if it doesn't exist
ALTER TABLE rejection_emails 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create a trigger to automatically update updated_at on row updates
-- (This will auto-update the column whenever a row is modified)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS update_rejection_emails_updated_at ON rejection_emails;
CREATE TRIGGER update_rejection_emails_updated_at
    BEFORE UPDATE ON rejection_emails
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'rejection_emails' AND column_name = 'updated_at';

