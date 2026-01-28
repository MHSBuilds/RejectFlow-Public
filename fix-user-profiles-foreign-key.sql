-- Fix user_profiles table to reference the correct users table (NextAuth users, not auth.users)
-- Run this in your Supabase SQL Editor

-- Step 1: Drop the existing foreign key constraint if it exists
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;

-- Step 2: Update the foreign key to reference the public.users table (NextAuth users)
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 3: Ensure user_id has UNIQUE constraint (for upsert to work)
-- Check if unique constraint exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_profiles_user_id_key' 
        AND conrelid = 'user_profiles'::regclass
    ) THEN
        ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- Step 4: Update RLS policies to work with NextAuth (remove auth.uid() references)
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Note: RLS policies using auth.uid() won't work with NextAuth
-- Since we're using supabaseAdmin (service role) in API routes, RLS is bypassed
-- If you want RLS, you'd need to implement custom policies based on JWT claims
-- For now, we'll disable RLS or allow all (since API routes use service role)
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Alternative: If you want to keep RLS enabled, create a policy that allows all
-- (since API routes use service role which bypasses RLS anyway)
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all for service role" ON user_profiles FOR ALL USING (true);

-- Step 5: Verify the changes
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'user_profiles' 
  AND tc.constraint_type = 'FOREIGN KEY';

-- Verify unique constraint exists
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'user_profiles' 
  AND constraint_type = 'UNIQUE';

