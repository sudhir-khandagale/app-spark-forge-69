-- Add rejection_reason column to stores table
ALTER TABLE public.stores 
ADD COLUMN rejection_reason text;