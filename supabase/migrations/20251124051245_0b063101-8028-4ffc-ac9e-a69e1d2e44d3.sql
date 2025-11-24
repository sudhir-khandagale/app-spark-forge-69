-- Add featured column to stores table
ALTER TABLE public.stores 
ADD COLUMN featured boolean DEFAULT false;

-- Create index for better performance when filtering featured stores
CREATE INDEX idx_stores_featured_status ON public.stores(featured, status) WHERE status = 'approved';