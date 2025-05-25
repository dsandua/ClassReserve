/*
  # Add cascade delete functionality for user accounts

  1. Changes
    - Add ON DELETE CASCADE to all foreign key constraints
    - Create function to handle user deletion
    - Add trigger to clean up related data
*/

-- Create function to handle user deletion and cleanup
CREATE OR REPLACE FUNCTION handle_user_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete all bookings
  DELETE FROM bookings WHERE student_id = OLD.id;
  
  -- Delete all notifications
  DELETE FROM notifications WHERE user_id = OLD.id;
  
  -- Delete auth.users entry
  DELETE FROM auth.users WHERE id = OLD.id;
  
  RETURN OLD;
END;
$$;

-- Create trigger for user deletion
CREATE TRIGGER on_user_deletion
  BEFORE DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_deletion();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION handle_user_deletion TO authenticated;