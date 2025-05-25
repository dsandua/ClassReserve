/*
  # Crear tabla de perfiles y políticas de seguridad

  1. Nueva Tabla
    - `profiles`
      - `id` (uuid, clave primaria, referencia a auth.users)
      - `name` (texto, nombre completo)
      - `role` (texto, rol del usuario: student/teacher)
      - `avatar_url` (texto, URL del avatar)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Seguridad
    - Habilitar RLS en la tabla profiles
    - Políticas para:
      - Lectura: usuarios autenticados pueden leer perfiles
      - Actualización: usuarios pueden actualizar su propio perfil
*/

-- Crear tabla de perfiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('student', 'teacher')),
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad
CREATE POLICY "Usuarios pueden ver todos los perfiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios pueden actualizar su propio perfil"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();