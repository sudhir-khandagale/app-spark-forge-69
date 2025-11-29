-- Add payment fields to stores table
ALTER TABLE stores 
ADD COLUMN bank_account_name TEXT,
ADD COLUMN bank_account_number TEXT,
ADD COLUMN bank_ifsc_code TEXT,
ADD COLUMN upi_id TEXT;

-- Create orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  items JSONB NOT NULL,
  total_amount DECIMAL NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  receipt_number TEXT UNIQUE,
  delivery_address JSONB,
  pickup_scheduled TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own orders
CREATE POLICY "Users can view their own orders"
ON orders FOR SELECT
USING (auth.uid() = user_id);

-- Users can create orders
CREATE POLICY "Users can create orders"
ON orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Vendors can view orders for their stores
CREATE POLICY "Vendors can view their store orders"
ON orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = orders.store_id
    AND stores.owner_id = auth.uid()
  )
);

-- Vendors can update order status
CREATE POLICY "Vendors can update their store orders"
ON orders FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = orders.store_id
    AND stores.owner_id = auth.uid()
  )
);

-- Add onboarding_completed to user_preferences
ALTER TABLE user_preferences 
ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;

-- Update trigger for orders
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();