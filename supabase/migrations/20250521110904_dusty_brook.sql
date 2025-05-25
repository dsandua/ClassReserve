/*
  # Fix Auth Policies

  1. Changes
    - Add policy for users to insert their own profile
    - Add policy for users to read all profiles
    - Add policy for users to update their own profile
    - Enable RLS on profiles table

  2. Security
    - Users can only create/update their own profile
    - All authenticated users can read profiles
*/

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own profile
CREATE POLICY "Users can create their own profile"
ON profiles FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow users to read all profiles
CREATE POLICY "Users can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);