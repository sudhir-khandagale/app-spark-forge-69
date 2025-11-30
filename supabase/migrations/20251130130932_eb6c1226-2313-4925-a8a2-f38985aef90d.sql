-- Add tracking number column to orders table
ALTER TABLE public.orders 
ADD COLUMN tracking_number text;

-- Add index for faster tracking number lookups
CREATE INDEX idx_orders_tracking_number ON public.orders(tracking_number) WHERE tracking_number IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.orders.tracking_number IS 'Shipping tracking number for order delivery';