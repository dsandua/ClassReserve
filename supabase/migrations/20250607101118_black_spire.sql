/*
  # Agregar campo precio a la tabla profiles

  1. Cambios
    - Agregar columna `price` a la tabla profiles
    - Establecer precio por defecto de €25.00
    - Actualizar registros existentes con el precio por defecto
    - Agregar índice para consultas de precio

  2. Seguridad
    - Mantener las políticas RLS existentes
    - Asegurar que solo los profesores puedan modificar precios
*/

-- Agregar columna precio a la tabla profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS price decimal(10,2) DEFAULT 25.00;

-- Actualizar registros existentes con precio por defecto
UPDATE profiles 
SET price = 25.00 
WHERE price IS NULL AND role = 'student';

-- Hacer que la columna sea NOT NULL para estudiantes
ALTER TABLE profiles 
ALTER COLUMN price SET NOT NULL;

-- Agregar índice para consultas de precio
CREATE INDEX IF NOT EXISTS profiles_price_idx ON profiles(price);