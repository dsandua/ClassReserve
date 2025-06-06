/*
  # Update availability table structure

  1. Changes
    - Add slots column as jsonb
    - Migrate existing data to new slots format
    - Drop old constraints and create new ones
    - Update primary key structure

  2. Security
    - Maintain existing RLS policies
    - Preserve data integrity during migration
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

-- Drop the old unique constraint (this is the constraint, not just an index)
ALTER TABLE availability DROP CONSTRAINT IF EXISTS availability_day_of_week_start_time_end_time_key;

-- Drop the old unique index if it exists
DROP INDEX IF EXISTS availability_day_of_week_key;

-- Create new unique constraint on day_of_week only
ALTER TABLE availability ADD CONSTRAINT availability_day_of_week_key UNIQUE (day_of_week);

-- Update primary key to include day_of_week
ALTER TABLE availability DROP CONSTRAINT IF EXISTS availability_pkey;
ALTER TABLE availability ADD CONSTRAINT availability_pkey 
PRIMARY KEY (id, day_of_week);