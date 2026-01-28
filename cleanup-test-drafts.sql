-- SQL script to remove all test drafts from rejection_emails table
-- Run this in your Supabase SQL Editor

-- Option 1: Delete all drafts (use with caution!)
DELETE FROM rejection_emails;

-- Option 2: Delete only drafts with specific statuses
-- DELETE FROM rejection_emails WHERE status IN ('draft', 'approved', 'sent');

-- Option 3: Delete drafts created before a specific date
-- DELETE FROM rejection_emails WHERE created_at < '2025-11-18';

-- After deletion, you may want to reset the sequence if using auto-increment IDs
-- (Not needed for UUID primary keys)

-- Verify deletion
SELECT COUNT(*) as remaining_drafts FROM rejection_emails;

