/*
  # Grant materialized view permissions

  1. Changes
    - Grant SELECT permission on my_student_class_history materialized view to authenticated role
    
  2. Security
    - Allows authenticated users to read from the materialized view
    - Required for booking creation and history viewing functionality
*/

GRANT SELECT ON materialized view my_student_class_history TO authenticated;