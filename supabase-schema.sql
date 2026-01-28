-- Supabase Database Schema for Recruitment Rejection Assistant
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Candidates table
CREATE TABLE candidates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    position VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Interview feedback table
CREATE TABLE interview_feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    interviewer_name VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
    notes TEXT,
    rejection_reasons TEXT[] DEFAULT '{}',
    areas_for_improvement TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Rejection emails table
CREATE TABLE rejection_emails (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    feedback_id UUID NOT NULL REFERENCES interview_feedback(id) ON DELETE CASCADE,
    draft_content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'rejected', 'sent')),
    version INTEGER NOT NULL DEFAULT 1,
    redraft_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE
);

-- 4. HR system data table (mock data)
CREATE TABLE hr_system_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    position VARCHAR(255) NOT NULL,
    interview_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'rejected', 'hired'))
);

-- Create indexes for better performance
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_candidates_created_at ON candidates(created_at);
CREATE INDEX idx_interview_feedback_candidate_id ON interview_feedback(candidate_id);
CREATE INDEX idx_rejection_emails_candidate_id ON rejection_emails(candidate_id);
CREATE INDEX idx_rejection_emails_status ON rejection_emails(status);
CREATE INDEX idx_rejection_emails_created_at ON rejection_emails(created_at);
CREATE INDEX idx_hr_system_data_candidate_id ON hr_system_data(candidate_id);
CREATE INDEX idx_hr_system_data_status ON hr_system_data(status);

-- Enable Row Level Security (RLS)
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE rejection_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_system_data ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS (allow all operations for now)
CREATE POLICY "Allow all operations on candidates" ON candidates FOR ALL USING (true);
CREATE POLICY "Allow all operations on interview_feedback" ON interview_feedback FOR ALL USING (true);
CREATE POLICY "Allow all operations on rejection_emails" ON rejection_emails FOR ALL USING (true);
CREATE POLICY "Allow all operations on hr_system_data" ON hr_system_data FOR ALL USING (true);

-- Insert sample data for testing
INSERT INTO candidates (full_name, email, position) VALUES
('John Smith', 'john.smith@example.com', 'Software Engineer'),
('Sarah Johnson', 'sarah.johnson@example.com', 'Product Manager'),
('Mike Chen', 'mike.chen@example.com', 'Data Scientist'),
('Emily Davis', 'emily.davis@example.com', 'UX Designer'),
('David Wilson', 'david.wilson@example.com', 'DevOps Engineer');

-- Insert sample interview feedback
INSERT INTO interview_feedback (candidate_id, interviewer_name, rating, notes, rejection_reasons, areas_for_improvement)
SELECT 
    c.id,
    'HR Team',
    CASE 
        WHEN c.full_name = 'John Smith' THEN 6
        WHEN c.full_name = 'Sarah Johnson' THEN 4
        WHEN c.full_name = 'Mike Chen' THEN 7
        WHEN c.full_name = 'Emily Davis' THEN 5
        WHEN c.full_name = 'David Wilson' THEN 3
    END,
    CASE 
        WHEN c.full_name = 'John Smith' THEN 'Good technical skills but lacks experience in our tech stack'
        WHEN c.full_name = 'Sarah Johnson' THEN 'Strong communication but limited product management experience'
        WHEN c.full_name = 'Mike Chen' THEN 'Excellent technical background but not a good cultural fit'
        WHEN c.full_name = 'Emily Davis' THEN 'Creative designer but portfolio lacks depth'
        WHEN c.full_name = 'David Wilson' THEN 'Good understanding of DevOps but lacks cloud experience'
    END,
    CASE 
        WHEN c.full_name = 'John Smith' THEN ARRAY['Insufficient experience', 'Tech stack mismatch']
        WHEN c.full_name = 'Sarah Johnson' THEN ARRAY['Limited PM experience', 'Leadership concerns']
        WHEN c.full_name = 'Mike Chen' THEN ARRAY['Cultural fit', 'Communication issues']
        WHEN c.full_name = 'Emily Davis' THEN ARRAY['Portfolio depth', 'Design process']
        WHEN c.full_name = 'David Wilson' THEN ARRAY['Cloud experience', 'Automation skills']
    END,
    CASE 
        WHEN c.full_name = 'John Smith' THEN ARRAY['Technical skills', 'Learning agility']
        WHEN c.full_name = 'Sarah Johnson' THEN ARRAY['Product strategy', 'Team leadership']
        WHEN c.full_name = 'Mike Chen' THEN ARRAY['Communication', 'Collaboration']
        WHEN c.full_name = 'Emily Davis' THEN ARRAY['Design systems', 'User research']
        WHEN c.full_name = 'David Wilson' THEN ARRAY['Cloud platforms', 'CI/CD automation']
    END
FROM candidates c;

-- Insert sample HR system data
INSERT INTO hr_system_data (candidate_id, position, interview_date, status)
SELECT 
    c.id,
    c.position,
    CURRENT_DATE - INTERVAL '7 days' * (RANDOM() * 5)::INTEGER,
    CASE 
        WHEN c.full_name IN ('John Smith', 'Sarah Johnson', 'Emily Davis', 'David Wilson') THEN 'rejected'
        WHEN c.full_name = 'Mike Chen' THEN 'hired'
        ELSE 'pending'
    END
FROM candidates c;
