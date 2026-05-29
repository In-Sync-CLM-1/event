-- Add LinkedIn URL to profiles table
ALTER TABLE profiles 
ADD COLUMN linkedin_url TEXT;

-- Add LinkedIn URL to registrations table
ALTER TABLE registrations 
ADD COLUMN linkedin_url TEXT;