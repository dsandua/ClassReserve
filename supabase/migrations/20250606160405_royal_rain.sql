/*
  # Update availability table structure

  1. Changes
    - Add slots column as JSONB to store multiple time slots per day
    - Update existing data to use new structure
    - Remove unique constraint on start_time and end_time
    - Add unique constraint on day_of_week only

  2. Data Migration
    - Convert existing availability records to new slots format
    - Clean up old structure
*/

-- Add slots column if it doesn't exist
ALTER TABLE availability 
ADD COLUMN IF NOT EXISTS slots jsonb;

-- Update existing records to use slots format
UPDATE availability 
SET slots = jsonb_build_array(
  jsonb_build_object(
    'startTime', start_time::text,
    'endTime', end_time::text
  )
)
WHERE slots IS NULL AND start_time IS NOT NULL AND end_time IS NOT NULL;

-- Drop the old unique constraint
DROP INDEX IF EXISTS availability_day_of_week_start_time_end_time_key;

-- Add new unique constraint on day_of_week only
DROP INDEX IF EXISTS availability_day_of_week_key;
CREATE UNIQUE INDEX IF NOT EXISTS availability_day_of_week_key 
ON availability (day_of_week);

-- Update primary key to include day_of_week
ALTER TABLE availability DROP CONSTRAINT IF EXISTS availability_pkey;
ALTER TABLE availability ADD CONSTRAINT availability_pkey 
PRIMARY KEY (id, day_of_week);