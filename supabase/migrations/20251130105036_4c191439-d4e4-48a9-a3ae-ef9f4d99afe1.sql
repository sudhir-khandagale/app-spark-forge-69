-- Add delivery settings to stores table
ALTER TABLE stores 
ADD COLUMN offers_delivery boolean DEFAULT false,
ADD COLUMN delivery_charges numeric DEFAULT 0,
ADD COLUMN cod_available boolean DEFAULT false;

-- Add delivery and payment fields to orders table
ALTER TABLE orders 
ADD COLUMN delivery_charges numeric DEFAULT 0,
ADD COLUMN payment_method text DEFAULT 'online',
ADD COLUMN delivery_status text DEFAULT 'pending';

COMMENT ON COLUMN stores.offers_delivery IS 'Whether the store offers home delivery service';
COMMENT ON COLUMN stores.delivery_charges IS 'Delivery charges per order in rupees';
COMMENT ON COLUMN stores.cod_available IS 'Whether the store accepts Cash on Delivery';
COMMENT ON COLUMN orders.payment_method IS 'Payment method: online (Razorpay) or cod (Cash on Delivery)';
COMMENT ON COLUMN orders.delivery_status IS 'Delivery status: pending, processing, shipped, out_for_delivery, delivered';