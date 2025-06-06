/*
  # Add settings table for booking configuration

  1. New Table
    - `settings`
      - `id` (text, primary key)
      - `min_advance` (smallint, minimum hours in advance to book)
      - `max_advance` (smallint, maximum days in advance to book)
      - `cancel_limit` (smallint, hours before class to cancel)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on settings table
    - Allow authenticated users to read settings
    - Only allow specific users to update settings
*/

CREATE TABLE IF NOT EXISTS settings (
  id text PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  min_advance smallint,
  max_advance smallint,
  cancel_limit smallint
);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read settings
CREATE POLICY "Enable read access for all users"
  ON settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert settings
CREATE POLICY "Enable insert for authenticated users only"
  ON settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow specific user to update settings (replace with actual teacher UUID)
CREATE POLICY "Enable update for users based on email"
  ON settings
  FOR UPDATE
  TO public
  USING (auth.uid() = 'e261a9b2-2dab-4220-aefb-a6c4fd08bd45'::uuid)
  WITH CHECK (auth.uid() = 'e261a9b2-2dab-4220-aefb-a6c4fd08bd45'::uuid);

-- Insert default settings
INSERT INTO settings (id, min_advance, max_advance, cancel_limit)
VALUES ('main', 3, 30, 12)
ON CONFLICT (id) DO NOTHING;