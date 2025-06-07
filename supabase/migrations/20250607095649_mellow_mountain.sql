/*
  # Actualizar función de historial de estudiantes para incluir precio

  1. Cambios
    - Actualizar la función get_my_student_class_history para incluir el campo price
    - Actualizar la vista materializada para incluir el precio
    - Refrescar la vista materializada
*/

-- Actualizar la función para incluir el precio
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
  price decimal(10,2),
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

-- Actualizar la vista materializada para incluir el precio
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

-- Recrear el índice único
CREATE UNIQUE INDEX my_student_class_history_pkey ON my_student_class_history(booking_id);

-- Otorgar permisos
GRANT SELECT ON my_student_class_history TO authenticated;