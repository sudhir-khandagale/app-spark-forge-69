-- Fix the security definer view by making it use SECURITY INVOKER (default, safe)
-- Drop and recreate the view with explicit SECURITY INVOKER
DROP VIEW IF EXISTS public.stores_public;

CREATE VIEW public.stores_public 
WITH (security_invoker = true)
AS
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
FROM public.stores
WHERE status = 'approved';

-- Grant access to the view
GRANT SELECT ON public.stores_public TO authenticated;
GRANT SELECT ON public.stores_public TO anon;