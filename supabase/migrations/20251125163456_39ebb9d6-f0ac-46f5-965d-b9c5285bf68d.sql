-- Add search_radius column to profiles table (in kilometers)
ALTER TABLE public.profiles
ADD COLUMN search_radius integer DEFAULT 10 NOT NULL;