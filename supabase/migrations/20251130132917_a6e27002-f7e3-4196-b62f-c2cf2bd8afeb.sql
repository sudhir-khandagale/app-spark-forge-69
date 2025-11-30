-- Add user status field for ban/suspend functionality
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'banned'));

-- Add admin notes field for tracking actions
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS admin_notes text;

-- Create admin_logs table for audit trail
CREATE TABLE IF NOT EXISTS admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_type text NOT NULL, -- 'user', 'store', 'product', 'order'
  target_id uuid NOT NULL,
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on admin_logs
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Admins can view all logs"
ON admin_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Only admins can insert logs
CREATE POLICY "Admins can insert logs"
ON admin_logs
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Add commission tracking to stores
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS commission_rate numeric DEFAULT 5.0 CHECK (commission_rate >= 0 AND commission_rate <= 100);

-- Create index for faster admin queries
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON profiles(account_status);