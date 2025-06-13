/*
  # Update function and materialized view to include price

  1. Changes
    - Drop and recreate get_my_student_class_history function to include price field
    - Update materialized view to include price field
    - Maintain all existing functionality while adding price support

  2. Security
    - Maintain existing RLS policies
    - Keep function security definer settings
*/

-- Drop the existing function first to avoid return type conflict
DROP FUNCTION IF EXISTS public.get_my_student_class_history(uuid);

-- Recreate the function with price included
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
  price numeric(10,2),
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
    b.price,
    b.created_at
  FROM bookings b
  JOIN profiles p ON p.id = b.student_id
  WHERE b.student_id = input_student_id
  ORDER BY b.date DESC, b.start_time DESC;
END;
$$;

-- Drop and recreate the materialized view to include price
DROP MATERIALIZED VIEW IF EXISTS my_student_class_history;

CREATE MATERIALIZED VIEW my_student_class_history AS
SELECT 
  b.id as booking_id,
  b.student_id,
  p.name as student_name,
  b.date,
  b.start_time,
  b.end_time,
  b.status,
  b.notes,
  b.price,
  b.created_at
FROM bookings b
JOIN profiles p ON b.student_id = p.id
WHERE p.role = 'student';

-- Recreate the unique index
CREATE UNIQUE INDEX my_student_class_history_pkey ON my_student_class_history(booking_id);

-- Grant permissions
GRANT SELECT ON my_student_class_history TO authenticated;