-- Create vendor_notifications table
CREATE TABLE IF NOT EXISTS public.vendor_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB
);

-- Add low_stock_threshold to inventory
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER NOT NULL DEFAULT 5;

-- Enable RLS
ALTER TABLE public.vendor_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendor_notifications
CREATE POLICY "Vendors can view their own notifications"
ON public.vendor_notifications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = vendor_notifications.store_id
    AND stores.owner_id = auth.uid()
  )
);

CREATE POLICY "Vendors can update their own notifications"
ON public.vendor_notifications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = vendor_notifications.store_id
    AND stores.owner_id = auth.uid()
  )
);

CREATE POLICY "System can insert notifications"
ON public.vendor_notifications
FOR INSERT
WITH CHECK (true);

-- Create function to check low stock and notify
CREATE OR REPLACE FUNCTION public.check_low_stock_and_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store_owner UUID;
  v_product_name TEXT;
  v_notification_exists BOOLEAN;
BEGIN
  -- Get store owner and product name
  SELECT s.owner_id, p.name
  INTO v_store_owner, v_product_name
  FROM stores s
  JOIN products p ON p.id = NEW.product_id
  WHERE s.id = NEW.store_id;

  -- Check if quantity is below threshold
  IF NEW.quantity <= NEW.low_stock_threshold AND NEW.quantity > 0 THEN
    -- Check if notification already exists for this inventory item
    SELECT EXISTS (
      SELECT 1 FROM vendor_notifications
      WHERE inventory_id = NEW.id
      AND type = 'low_stock'
      AND read = false
    ) INTO v_notification_exists;

    -- Create notification only if it doesn't exist
    IF NOT v_notification_exists THEN
      INSERT INTO vendor_notifications (
        vendor_id,
        store_id,
        inventory_id,
        type,
        title,
        message,
        metadata
      ) VALUES (
        v_store_owner,
        NEW.store_id,
        NEW.id,
        'low_stock',
        'Low Stock Alert',
        v_product_name || ' is running low (only ' || NEW.quantity || ' left)',
        jsonb_build_object(
          'product_name', v_product_name,
          'current_quantity', NEW.quantity,
          'threshold', NEW.low_stock_threshold
        )
      );
    END IF;
  ELSIF NEW.quantity = 0 THEN
    -- Check if out of stock notification exists
    SELECT EXISTS (
      SELECT 1 FROM vendor_notifications
      WHERE inventory_id = NEW.id
      AND type = 'out_of_stock'
      AND read = false
    ) INTO v_notification_exists;

    -- Create out of stock notification
    IF NOT v_notification_exists THEN
      INSERT INTO vendor_notifications (
        vendor_id,
        store_id,
        inventory_id,
        type,
        title,
        message,
        metadata
      ) VALUES (
        v_store_owner,
        NEW.store_id,
        NEW.id,
        'out_of_stock',
        'Out of Stock Alert',
        v_product_name || ' is now out of stock',
        jsonb_build_object(
          'product_name', v_product_name,
          'current_quantity', 0,
          'threshold', NEW.low_stock_threshold
        )
      );
    END IF;
  ELSIF NEW.quantity > NEW.low_stock_threshold THEN
    -- Mark related notifications as read when stock is replenished
    UPDATE vendor_notifications
    SET read = true
    WHERE inventory_id = NEW.id
    AND type IN ('low_stock', 'out_of_stock')
    AND read = false;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS check_low_stock_trigger ON public.inventory;
CREATE TRIGGER check_low_stock_trigger
AFTER UPDATE OF quantity ON public.inventory
FOR EACH ROW
EXECUTE FUNCTION public.check_low_stock_and_notify();

-- Enable realtime for vendor_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.vendor_notifications;