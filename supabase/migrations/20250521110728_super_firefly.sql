/*
  # Crear esquema para sistema de reservas

  1. Nuevas Tablas
    - `bookings`: Almacena las reservas de clases
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key a profiles)
      - `date` (date)
      - `start_time` (time)
      - `end_time` (time)
      - `status` (enum: pending, confirmed, cancelled, completed)
      - `meeting_link` (text, opcional)
      - `custom_meeting_link` (text, opcional)
      - `notes` (text, opcional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `availability`: Almacena la disponibilidad del profesor
      - `id` (uuid, primary key)
      - `day_of_week` (smallint, 0-6)
      - `is_available` (boolean)
      - `start_time` (time)
      - `end_time` (time)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `blocked_times`: Almacena períodos bloqueados
      - `id` (uuid, primary key)
      - `start_date` (timestamptz)
      - `end_date` (timestamptz)
      - `reason` (text, opcional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `notifications`: Almacena notificaciones del sistema
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key a profiles)
      - `type` (enum: booking, reminder, cancellation, system)
      - `title` (text)
      - `message` (text)
      - `read` (boolean)
      - `link` (text, opcional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Seguridad
    - Habilitar RLS en todas las tablas
    - Políticas para:
      - Estudiantes: ver y gestionar sus propias reservas
      - Profesor: ver y gestionar todas las reservas
      - Usuarios: ver y gestionar sus propias notificaciones
*/

-- Crear tipos enumerados
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE notification_type AS ENUM ('booking', 'reminder', 'cancellation', 'system');

-- Crear tabla de reservas
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  meeting_link text,
  custom_meeting_link text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear tabla de disponibilidad
CREATE TABLE IF NOT EXISTS availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_available boolean NOT NULL DEFAULT true,
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (day_of_week, start_time, end_time)
);

-- Crear tabla de períodos bloqueados
CREATE TABLE IF NOT EXISTS blocked_times (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (end_date > start_date)
);

-- Crear tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  link text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para bookings
CREATE POLICY "Estudiantes pueden ver sus propias reservas"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = student_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

CREATE POLICY "Estudiantes pueden crear reservas"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = student_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'student'
    )
  );

CREATE POLICY "Estudiantes pueden cancelar sus reservas"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = student_id AND
    status = 'pending'
  )
  WITH CHECK (
    status = 'cancelled'
  );

CREATE POLICY "Profesor puede gestionar todas las reservas"
  ON bookings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- Políticas para availability
CREATE POLICY "Todos pueden ver la disponibilidad"
  ON availability
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Solo el profesor puede gestionar la disponibilidad"
  ON availability
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- Políticas para blocked_times
CREATE POLICY "Todos pueden ver los períodos bloqueados"
  ON blocked_times
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Solo el profesor puede gestionar los períodos bloqueados"
  ON blocked_times
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- Políticas para notifications
CREATE POLICY "Usuarios pueden ver sus propias notificaciones"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propias notificaciones"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propias notificaciones"
  ON notifications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Triggers para updated_at
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_updated_at
  BEFORE UPDATE ON availability
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blocked_times_updated_at
  BEFORE UPDATE ON blocked_times
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insertar disponibilidad por defecto
INSERT INTO availability (day_of_week, start_time, end_time)
VALUES
  (1, '10:00', '11:00'),
  (1, '11:00', '12:00'),
  (1, '15:00', '16:00'),
  (1, '16:00', '17:00'),
  (1, '17:00', '18:00'),
  (1, '19:00', '20:00'),
  (2, '10:00', '11:00'),
  (2, '11:00', '12:00'),
  (2, '15:00', '16:00'),
  (2, '16:00', '17:00'),
  (2, '17:00', '18:00'),
  (2, '19:00', '20:00'),
  (3, '10:00', '11:00'),
  (3, '11:00', '12:00'),
  (3, '15:00', '16:00'),
  (3, '16:00', '17:00'),
  (3, '17:00', '18:00'),
  (3, '19:00', '20:00'),
  (4, '10:00', '11:00'),
  (4, '11:00', '12:00'),
  (4, '15:00', '16:00'),
  (4, '16:00', '17:00'),
  (4, '17:00', '18:00'),
  (4, '19:00', '20:00'),
  (5, '10:00', '11:00'),
  (5, '11:00', '12:00'),
  (5, '15:00', '16:00'),
  (5, '16:00', '17:00'),
  (5, '17:00', '18:00'),
  (5, '19:00', '20:00')
ON CONFLICT DO NOTHING;