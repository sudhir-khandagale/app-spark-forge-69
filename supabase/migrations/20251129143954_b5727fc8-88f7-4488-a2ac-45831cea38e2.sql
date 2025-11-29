-- Add banner_url to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Add social_links to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- Add comment for social_links structure
COMMENT ON COLUMN public.profiles.social_links IS 'JSON object containing social media links: {"twitter": "url", "linkedin": "url", "instagram": "url", "github": "url", "website": "url"}';