-- Create vendor leaderboard cache table
CREATE TABLE IF NOT EXISTS public.vendor_leaderboard_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('weekly', 'monthly', 'alltime')),
  rank INTEGER NOT NULL,
  total_sales NUMERIC DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  average_rating NUMERIC DEFAULT 0,
  response_time_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(vendor_id, store_id, period)
);

-- Create vendor challenges table
CREATE TABLE IF NOT EXISTS public.vendor_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('products', 'sales', 'rating', 'posts', 'response_time')),
  requirement_value INTEGER NOT NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('badge', 'featured_listing', 'discount', 'points')),
  reward_value JSONB,
  icon TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create vendor challenge progress table
CREATE TABLE IF NOT EXISTS public.vendor_challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.vendor_challenges(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  reward_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(vendor_id, challenge_id)
);

-- Enable RLS
ALTER TABLE public.vendor_leaderboard_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_challenge_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendor_leaderboard_cache
CREATE POLICY "Anyone can view leaderboard" ON public.vendor_leaderboard_cache
  FOR SELECT USING (true);

CREATE POLICY "System can manage leaderboard" ON public.vendor_leaderboard_cache
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for vendor_challenges
CREATE POLICY "Anyone can view active challenges" ON public.vendor_challenges
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage challenges" ON public.vendor_challenges
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for vendor_challenge_progress
CREATE POLICY "Vendors can view their own progress" ON public.vendor_challenge_progress
  FOR SELECT USING (vendor_id = auth.uid());

CREATE POLICY "Vendors can view other vendors progress" ON public.vendor_challenge_progress
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.stores WHERE id = vendor_challenge_progress.store_id
  ));

CREATE POLICY "System can manage progress" ON public.vendor_challenge_progress
  FOR ALL USING (vendor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Insert default challenges
INSERT INTO public.vendor_challenges (name, description, challenge_type, requirement_value, reward_type, reward_value, icon) VALUES
  ('Product Starter', 'List your first 10 products', 'products', 10, 'badge', '{"badge": "Product Starter", "color": "bronze"}'::jsonb, 'Package'),
  ('Product Pro', 'List 50 products in your store', 'products', 50, 'featured_listing', '{"days": 7}'::jsonb, 'Crown'),
  ('Sales Champion', 'Complete 100 orders', 'sales', 100, 'badge', '{"badge": "Sales Champion", "color": "gold"}'::jsonb, 'TrendingUp'),
  ('Five Star Vendor', 'Achieve 5.0 average rating', 'rating', 50, 'badge', '{"badge": "Five Star Vendor", "color": "gold"}'::jsonb, 'Star'),
  ('Social Butterfly', 'Post 10 stories or posts', 'posts', 10, 'points', '{"points": 500}'::jsonb, 'Share2')
ON CONFLICT DO NOTHING;