/*
  # Create Gegana Music Studio POS Database Schema

  1. New Tables
    - `users` - User authentication and roles
    - `transactions` - All transaction records
    - `transaction_items` - Items within each transaction
    - `booking_statuses` - Studio booking status tracking
    - `attendances` - Employee attendance records

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Role-based access control

  3. Features
    - UUID primary keys
    - Timestamps for audit trail
    - Proper foreign key relationships
    - Indexes for performance
*/

-- Users table for authentication and roles
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'staff')),
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total numeric NOT NULL DEFAULT 0,
  amount_paid numeric NOT NULL DEFAULT 0,
  change_amount numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'qris', 'transfer')),
  payment_type text NOT NULL CHECK (payment_type IN ('full', 'dp')),
  dp_amount numeric DEFAULT NULL,
  remaining_amount numeric DEFAULT NULL,
  customer_name text NOT NULL,
  customer_phone text DEFAULT NULL,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Transaction items table
CREATE TABLE IF NOT EXISTS transaction_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('studio', 'product')),
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  -- Studio booking details (JSON for flexibility)
  details jsonb DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

-- Booking statuses table
CREATE TABLE IF NOT EXISTS booking_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  booking_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  customer_name text NOT NULL,
  customer_phone text DEFAULT NULL,
  notes text DEFAULT NULL,
  status text NOT NULL DEFAULT 'on_process' CHECK (status IN ('on_process', 'done')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Attendances table
CREATE TABLE IF NOT EXISTS attendances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  clock_in timestamptz NOT NULL,
  clock_out timestamptz DEFAULT NULL,
  attendance_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for transactions
CREATE POLICY "Users can read all transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own transactions"
  ON transactions
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

-- RLS Policies for transaction_items
CREATE POLICY "Users can read all transaction items"
  ON transaction_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create transaction items"
  ON transaction_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for booking_statuses
CREATE POLICY "Users can read all booking statuses"
  ON booking_statuses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create booking statuses"
  ON booking_statuses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update booking statuses"
  ON booking_statuses
  FOR UPDATE
  TO authenticated
  USING (true);

-- RLS Policies for attendances
CREATE POLICY "Users can read all attendances"
  ON attendances
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own attendance"
  ON attendances
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own attendance"
  ON attendances
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_name);
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_booking_statuses_date ON booking_statuses(booking_date);
CREATE INDEX IF NOT EXISTS idx_booking_statuses_status ON booking_statuses(status);
CREATE INDEX IF NOT EXISTS idx_attendances_user_date ON attendances(user_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendances_date ON attendances(attendance_date);

-- Insert demo users (passwords should be hashed in production)
INSERT INTO users (username, name, role, password_hash) VALUES
  ('admin', 'Administrator', 'admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'), -- password: admin123
  ('staff1', 'Staff Satu', 'staff', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'), -- password: staff123
  ('staff2', 'Staff Dua', 'staff', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi') -- password: staff123
ON CONFLICT (username) DO NOTHING;