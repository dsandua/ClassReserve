/*
  # Update availability table structure

  1. Changes
    - Add slots jsonb column to store multiple time slots per day
    - Update existing records to use new slots format
    - Remove old unique constraints and create new ones
    - Update primary key structure

  2. Database Structure
    - Each day can have multiple time slots stored in jsonb format
    - Unique constraint on day_of_week only
    - Primary key includes both id and day_of_week
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

-- Drop the old unique constraint on (day_of_week, start_time, end_time)
ALTER TABLE availability DROP CONSTRAINT IF EXISTS availability_day_of_week_start_time_end_time_key;

-- Drop any existing unique constraint on day_of_week
ALTER TABLE availability DROP CONSTRAINT IF EXISTS availability_day_of_week_key;

-- Create new unique constraint on day_of_week only
ALTER TABLE availability ADD CONSTRAINT availability_day_of_week_unique UNIQUE (day_of_week);

-- Update primary key structure
ALTER TABLE availability DROP CONSTRAINT IF EXISTS availability_pkey;
ALTER TABLE availability ADD CONSTRAINT availability_pkey 
PRIMARY KEY (id, day_of_week);