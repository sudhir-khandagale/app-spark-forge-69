-- Create QR redemptions table for tracking customer visits and sales
CREATE TABLE IF NOT EXISTS public.qr_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code TEXT UNIQUE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scanned', 'redeemed', 'expired')),
  scanned_at TIMESTAMPTZ,
  redeemed_at TIMESTAMPTZ,
  scanned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '24 hours')
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_qr_redemptions_qr_code ON public.qr_redemptions(qr_code);
CREATE INDEX IF NOT EXISTS idx_qr_redemptions_store_id ON public.qr_redemptions(store_id);
CREATE INDEX IF NOT EXISTS idx_qr_redemptions_user_id ON public.qr_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_redemptions_status ON public.qr_redemptions(status);

-- Enable RLS
ALTER TABLE public.qr_redemptions ENABLE ROW LEVEL SECURITY;

-- Customers can view their own QR codes
CREATE POLICY "Users can view their own QR codes"
ON public.qr_redemptions
FOR SELECT
USING (auth.uid() = user_id);

-- Customers can create QR codes
CREATE POLICY "Users can create QR codes"
ON public.qr_redemptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Vendors can view QR codes for their stores
CREATE POLICY "Vendors can view their store QR codes"
ON public.qr_redemptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = qr_redemptions.store_id
    AND stores.owner_id = auth.uid()
  )
);

-- Vendors can update (scan/redeem) QR codes for their stores
CREATE POLICY "Vendors can update their store QR codes"
ON public.qr_redemptions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = qr_redemptions.store_id
    AND stores.owner_id = auth.uid()
  )
);

-- Admins can manage all QR codes
CREATE POLICY "Admins can manage all QR codes"
ON public.qr_redemptions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));