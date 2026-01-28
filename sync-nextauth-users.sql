-- Sync NextAuth users to Supabase users table
-- This script ensures all authenticated users exist in the users table
-- Run this in your Supabase SQL Editor

-- Step 1: Check for users in user_profiles that don't exist in users table
SELECT 
    up.user_id,
    up.sender_name,
    up.company_name,
    'Missing from users table' as issue
FROM user_profiles up
LEFT JOIN users u ON up.user_id = u.id
WHERE u.id IS NULL;

-- Step 2: If you have user emails from user_profiles or other sources,
-- you can manually insert them. However, since we don't have email in user_profiles,
-- we need to handle this differently.

-- Step 3: Create a function to safely create users if they don't exist
-- This will be called from the application code, but we can also use it here

-- For now, the application code will handle creating users automatically
-- when they try to save their profile.

-- Step 4: If you know the user_id and email, you can manually insert:
-- (Replace with actual values)
/*
INSERT INTO users (id, email, full_name, provider, created_at, updated_at)
VALUES 
    ('e9639888-e42a-41aa-818d-436ba1e5e4b4', 'hassaan.sajjad@gmail.com', 'Hassaan Sajjad', 'google', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
*/

-- Step 5: Verify all user_profiles have corresponding users
SELECT 
    COUNT(*) as orphaned_profiles
FROM user_profiles up
LEFT JOIN users u ON up.user_id = u.id
WHERE u.id IS NULL;

-- If orphaned_profiles > 0, you need to create those users manually
-- or they will be created automatically when they try to save their profile









