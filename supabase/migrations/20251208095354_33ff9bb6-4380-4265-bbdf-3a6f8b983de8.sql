-- Create a secure view for public store data (excluding banking information)
CREATE OR REPLACE VIEW public.stores_public AS
SELECT 
  id,
  name,
  description,
  address,
  phone,
  email,
  latitude,
  longitude,
  rating,
  review_count,
  hours,
  photo_urls,
  specialties,
  featured,
  status,
  owner_id,
  offers_delivery,
  delivery_charges,
  cod_available,
  google_maps_link,
  created_at,
  updated_at
  -- Excluded: bank_account_name, bank_account_number, bank_ifsc_code, upi_id, commission_rate, rejection_reason
FROM public.stores;

-- Grant access to the view
GRANT SELECT ON public.stores_public TO authenticated;
GRANT SELECT ON public.stores_public TO anon;

-- Create RLS policy on the view (views inherit from base table but we make it explicit)
-- Anyone can view approved stores through the public view
CREATE POLICY "Anyone can view approved stores via public view"
ON public.stores
FOR SELECT
USING (
  status = 'approved' 
  OR owner_id = auth.uid() 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Drop the old overly permissive policy if it exists
DROP POLICY IF EXISTS "Anyone can view approved stores" ON public.stores;