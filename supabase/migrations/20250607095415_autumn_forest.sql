/*
  # Agregar columna precio a la tabla bookings

  1. Cambios
    - Agregar columna `price` (decimal) a la tabla bookings
    - Establecer un precio por defecto para las reservas existentes
    - Agregar índice para consultas de precio

  2. Estructura
    - `price` (decimal, precio por hora de clase)
    - Valor por defecto: 25.00 (euros por hora)
*/

-- Agregar columna precio a la tabla bookings
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS price decimal(10,2) DEFAULT 25.00;

-- Actualizar registros existentes con precio por defecto
UPDATE bookings 
SET price = 25.00 
WHERE price IS NULL;

-- Hacer que la columna sea NOT NULL
ALTER TABLE bookings 
ALTER COLUMN price SET NOT NULL;

-- Agregar índice para consultas de precio
CREATE INDEX IF NOT EXISTS bookings_price_idx ON bookings(price);