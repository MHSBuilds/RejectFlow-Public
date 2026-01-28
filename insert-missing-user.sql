-- Manually insert the missing user into the users table
-- Replace the values below with your actual user information
-- Run this in your Supabase SQL Editor

-- Insert user (replace with your actual email and name)
INSERT INTO users (id, email, full_name, provider, created_at, updated_at)
VALUES 
    ('e9639888-e42a-41aa-818d-436ba1e5e4b4', 'hassaan.sajjad@gmail.com', 'Hassaan Sajjad', 'google', NOW(), NOW())
ON CONFLICT (id) DO UPDATE
SET 
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

-- Verify the user was created
SELECT id, email, full_name, provider, created_at
FROM users
WHERE id = 'e9639888-e42a-41aa-818d-436ba1e5e4b4';

