-- Add delivery time slot and estimated delivery to orders table
ALTER TABLE orders 
ADD COLUMN delivery_time_slot text,
ADD COLUMN estimated_delivery timestamp with time zone;

-- Add comment for documentation
COMMENT ON COLUMN orders.delivery_time_slot IS 'Selected delivery time slot (e.g., "9AM-12PM", "12PM-3PM")';
COMMENT ON COLUMN orders.estimated_delivery IS 'Estimated delivery date and time';