/*
  # Create blocked_time_slots table

  1. New Tables
    - `blocked_time_slots`
      - `id` (uuid, primary key)
      - `teacher_id` (uuid, foreign key to auth.users)
      - `date` (date)
      - `startTime` (time)
      - `endTime` (time)
      - `reason` (text, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `blocked_time_slots` table
    - Add policy for teachers to manage their own blocked times
*/

CREATE TABLE IF NOT EXISTS blocked_time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  startTime time,
  endTime time,
  reason text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE blocked_time_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view their own blocked time slots"
  ON blocked_time_slots
  FOR SELECT
  TO authenticated
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert their own blocked time slots"
  ON blocked_time_slots
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own blocked time slots"
  ON blocked_time_slots
  FOR DELETE
  TO authenticated
  USING (auth.uid() = teacher_id);

CREATE INDEX IF NOT EXISTS blocked_time_slots_teacher_id_date 
  ON blocked_time_slots(teacher_id, date);
