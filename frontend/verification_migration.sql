-- Add verification_status column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified';
-- Statuses: 'unverified', 'pending', 'verified'

-- Optional: Add constraint
ALTER TABLE profiles ADD CONSTRAINT check_verification_status CHECK (verification_status IN ('unverified', 'pending', 'verified'));
