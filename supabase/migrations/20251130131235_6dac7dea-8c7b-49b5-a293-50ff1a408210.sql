-- Add vendor response columns to product_reviews table
ALTER TABLE public.product_reviews 
ADD COLUMN vendor_response text,
ADD COLUMN vendor_responded_at timestamp with time zone;

-- Create order_notes table for vendor-customer communication
CREATE TABLE public.order_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  message text NOT NULL,
  is_vendor boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add index for faster order notes lookup
CREATE INDEX idx_order_notes_order_id ON public.order_notes(order_id);
CREATE INDEX idx_order_notes_created_at ON public.order_notes(created_at DESC);

-- Enable RLS for order_notes
ALTER TABLE public.order_notes ENABLE ROW LEVEL SECURITY;

-- Allow users to view notes for their orders
CREATE POLICY "Users can view notes for their orders"
ON public.order_notes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_notes.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Allow vendors to view notes for their store orders
CREATE POLICY "Vendors can view notes for their store orders"
ON public.order_notes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    JOIN public.stores ON stores.id = orders.store_id
    WHERE orders.id = order_notes.order_id
    AND stores.owner_id = auth.uid()
  )
);

-- Allow users to create notes for their orders
CREATE POLICY "Users can create notes for their orders"
ON public.order_notes FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_notes.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Allow vendors to create notes for their store orders
CREATE POLICY "Vendors can create notes for their store orders"
ON public.order_notes FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND is_vendor = true
  AND EXISTS (
    SELECT 1 FROM public.orders
    JOIN public.stores ON stores.id = orders.store_id
    WHERE orders.id = order_notes.order_id
    AND stores.owner_id = auth.uid()
  )
);

-- Add comments
COMMENT ON COLUMN public.product_reviews.vendor_response IS 'Store owner response to customer review';
COMMENT ON COLUMN public.product_reviews.vendor_responded_at IS 'Timestamp when vendor responded to review';
COMMENT ON TABLE public.order_notes IS 'Communication notes between vendors and customers for orders';