/*
  # Add email column to profiles table

  1. Changes
    - Add email column to profiles table
    - Add unique constraint on email
    - Add index for email lookups
    - Handle existing rows by copying email from auth.users
  
  2. Security
    - Ensure no null values in email column
    - Maintain data integrity with unique constraint
*/

-- Create a function to get user email from auth.users
CREATE OR REPLACE FUNCTION get_user_email(user_id uuid)
RETURNS text AS $$
BEGIN
    RETURN (
        SELECT email 
        FROM auth.users 
        WHERE id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add email column without NOT NULL constraint initially
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email text;

-- Update existing rows with email from auth.users
UPDATE profiles
SET email = get_user_email(id)
WHERE email IS NULL;

-- Now add NOT NULL constraint
ALTER TABLE profiles 
ALTER COLUMN email SET NOT NULL;

-- Add unique constraint
ALTER TABLE profiles 
ADD CONSTRAINT profiles_email_key UNIQUE (email);

-- Add index for email lookups
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles (email);

-- Clean up the helper function
DROP FUNCTION get_user_email;