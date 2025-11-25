-- Fix existing stores where Google Maps links are in the address field
-- Move Google Maps URLs from address to google_maps_link field

UPDATE stores
SET 
  google_maps_link = address,
  address = 'Address pending update'
WHERE 
  address LIKE 'http%maps%'
  AND (google_maps_link IS NULL OR google_maps_link = '');