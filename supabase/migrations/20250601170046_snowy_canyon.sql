/*
  # Add Student History Function

  1. New Function
    - `get_my_student_class_history(input_student_id uuid)`
      Returns a student's booking history with all relevant details
      
  2. Function Details
    - Takes a student ID as input
    - Returns a table with booking details including:
      - booking_id
      - student_id
      - student_name
      - date
      - start_time
      - end_time
      - status
      - notes
      - created_at
    - Joins bookings with profiles to get student names
    - Orders results by date and time (most recent first)
*/

CREATE OR REPLACE FUNCTION public.get_my_student_class_history(input_student_id uuid)
RETURNS TABLE (
  booking_id uuid,
  student_id uuid,
  student_name text,
  date date,
  start_time time without time zone,
  end_time time without time zone,
  status booking_status,
  notes text,
  created_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
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
  JOIN profiles p ON p.id = b.student_id
  WHERE b.student_id = input_student_id
  ORDER BY b.date DESC, b.start_time DESC;
END;
$$;