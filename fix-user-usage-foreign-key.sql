-- Fix user_usage foreign key constraint
-- This script ensures the foreign key points to public.users (not auth.users)

-- First, check the current foreign key constraint
-- Run this to see what table it references:
-- SELECT conname, conrelid::regclass, confrelid::regclass 
-- FROM pg_constraint 
-- WHERE conname = 'user_usage_user_id_fkey';

-- Drop the existing foreign key if it points to the wrong table
ALTER TABLE user_usage 
DROP CONSTRAINT IF EXISTS user_usage_user_id_fkey;

-- Add the correct foreign key pointing to public.users
ALTER TABLE user_usage
ADD CONSTRAINT user_usage_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- Verify the constraint was created correctly
-- The constraint should now reference public.users, not auth.users