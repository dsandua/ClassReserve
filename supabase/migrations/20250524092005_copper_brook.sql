/*
  # Clean up database and add relationships

  1. Clean up test data
    - Remove all test data from notifications, bookings, blocked_times, and availability tables
    - Refresh materialized view

  2. Add check constraints
    - Ensure end times are after start times for bookings
    - Ensure end dates are after start dates for blocked times
    - Ensure end times are after start times for availability slots

  3. Add default availability
    - Add default time slots for weekdays
    - Skip if slots already exist
*/

-- First, clean up all test data
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE bookings CASCADE;
TRUNCATE TABLE blocked_times CASCADE;
TRUNCATE TABLE availability CASCADE;
REFRESH MATERIALIZED VIEW student_class_history;

-- Add check constraints
ALTER TABLE bookings
ADD CONSTRAINT bookings_time_check
CHECK (end_time > start_time);

ALTER TABLE blocked_times
ADD CONSTRAINT blocked_times_dates_check
CHECK (end_date > start_date);

ALTER TABLE availability
ADD CONSTRAINT availability_time_check
CHECK (end_time > start_time);

-- Add default availability slots
INSERT INTO availability (day_of_week, start_time, end_time, is_available)
VALUES
  (1, '09:00', '10:00', true),
  (1, '10:00', '11:00', true),
  (1, '11:00', '12:00', true),
  (1, '15:00', '16:00', true),
  (1, '16:00', '17:00', true),
  (2, '09:00', '10:00', true),
  (2, '10:00', '11:00', true),
  (2, '11:00', '12:00', true),
  (2, '15:00', '16:00', true),
  (2, '16:00', '17:00', true),
  (3, '09:00', '10:00', true),
  (3, '10:00', '11:00', true),
  (3, '11:00', '12:00', true),
  (3, '15:00', '16:00', true),
  (3, '16:00', '17:00', true),
  (4, '09:00', '10:00', true),
  (4, '10:00', '11:00', true),
  (4, '11:00', '12:00', true),
  (4, '15:00', '16:00', true),
  (4, '16:00', '17:00', true),
  (5, '09:00', '10:00', true),
  (5, '10:00', '11:00', true),
  (5, '11:00', '12:00', true),
  (5, '15:00', '16:00', true),
  (5, '16:00', '17:00', true)
ON CONFLICT (day_of_week, start_time, end_time) DO NOTHING;