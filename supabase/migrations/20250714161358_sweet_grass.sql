/*
  # Add INSERT policy for notifications table

  1. Changes
    - Add policy to allow authenticated users to insert notifications
    - Allow users to create notifications for themselves
    - Allow students to create notifications for teachers (booking requests)
    - Allow teachers to create notifications for students (confirmations, cancellations)

  2. Security
    - Maintains RLS protection
    - Only allows cross-role notifications between students and teachers
    - Prevents unauthorized notification creation
*/

-- Add INSERT policy for notifications
CREATE POLICY "Allow authenticated users to insert notifications for themselves or other roles"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() -- User can insert for themselves
    OR (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student') AND -- If current user is a student
      EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND role = 'teacher')        -- And target user is a teacher
    )
    OR (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher') AND -- If current user is a teacher
      EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND role = 'student')        -- And target user is a student
    )
  );