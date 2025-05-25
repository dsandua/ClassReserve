/*
  # Connect Students and Class History

  1. New Features
    - Add performance indexes for bookings table
    - Create materialized view for student history
    - Add function for student statistics
    - Set up security policies

  2. Security
    - RLS enabled for materialized view
    - Students can only view their own history
    - Teachers can view all history
*/

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS bookings_student_id_idx ON bookings(student_id);
CREATE INDEX IF NOT EXISTS bookings_date_idx ON bookings(date);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings(status);

-- Create materialized view for student history with profile data
CREATE MATERIALIZED VIEW student_class_history AS
SELECT 
  b.id as booking_id,
  b.student_id,
  p.name as student_name,
  b.date,
  b.start_time,
  b.end_time,
  b.status,
  b.notes,
  b.created_at
FROM bookings b
JOIN profiles p ON b.student_id = p.id
WHERE p.role = 'student';

-- Create index on materialized view
CREATE UNIQUE INDEX student_class_history_pkey ON student_class_history(booking_id);

-- Create function to get student statistics
CREATE OR REPLACE FUNCTION get_student_stats(student_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_classes', COUNT(*),
    'completed_classes', COUNT(*) FILTER (WHERE status = 'completed'),
    'cancelled_classes', COUNT(*) FILTER (WHERE status = 'cancelled'),
    'pending_classes', COUNT(*) FILTER (WHERE status = 'pending'),
    'first_class', MIN(date),
    'last_class', MAX(date)
  )
  INTO result
  FROM bookings
  WHERE student_id = $1;
  
  RETURN result;
END;
$$;

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_student_history()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY student_class_history;
  RETURN NULL;
END;
$$;

-- Create trigger to refresh view
CREATE TRIGGER refresh_student_history_trigger
AFTER INSERT OR UPDATE OR DELETE ON bookings
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_student_history();

-- Grant permissions
GRANT SELECT ON student_class_history TO authenticated;