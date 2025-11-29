-- Create vendor_posts table for vendor social posts
CREATE TABLE IF NOT EXISTS public.vendor_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  post_type TEXT NOT NULL CHECK (post_type IN ('product_showcase', 'behind_scenes', 'success_story', 'announcement')),
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create vendor_stories table for 24-hour content
CREATE TABLE IF NOT EXISTS public.vendor_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  caption TEXT,
  story_type TEXT DEFAULT 'regular' CHECK (story_type IN ('regular', 'poll', 'question', 'flash_sale')),
  metadata JSONB DEFAULT '{}',
  views_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create vendor_achievements table
CREATE TABLE IF NOT EXISTS public.vendor_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  badge_color TEXT DEFAULT 'gold',
  requirement_type TEXT NOT NULL CHECK (requirement_type IN ('orders', 'rating', 'products', 'reviews', 'response_time', 'followers')),
  requirement_value INTEGER NOT NULL,
  points_reward INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_vendor_achievements junction table
CREATE TABLE IF NOT EXISTS public.user_vendor_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.vendor_achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  progress INTEGER DEFAULT 0,
  UNIQUE(vendor_id, achievement_id)
);

-- Create vendor_followers table
CREATE TABLE IF NOT EXISTS public.vendor_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, vendor_id)
);

-- Create post_likes table
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.vendor_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Create post_comments table
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.vendor_posts(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendor_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vendor_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendor_posts
CREATE POLICY "Anyone can view posts from approved stores" ON public.vendor_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.stores 
      WHERE stores.id = vendor_posts.store_id 
      AND stores.status = 'approved'
    )
  );

CREATE POLICY "Vendors can create their own posts" ON public.vendor_posts
  FOR INSERT WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Vendors can update their own posts" ON public.vendor_posts
  FOR UPDATE USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can delete their own posts" ON public.vendor_posts
  FOR DELETE USING (auth.uid() = vendor_id);

-- RLS Policies for vendor_stories
CREATE POLICY "Anyone can view active stories from approved stores" ON public.vendor_stories
  FOR SELECT USING (
    expires_at > now() AND
    EXISTS (
      SELECT 1 FROM public.stores 
      WHERE stores.id = vendor_stories.store_id 
      AND stores.status = 'approved'
    )
  );

CREATE POLICY "Vendors can create their own stories" ON public.vendor_stories
  FOR INSERT WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Vendors can delete their own stories" ON public.vendor_stories
  FOR DELETE USING (auth.uid() = vendor_id);

-- RLS Policies for vendor_achievements
CREATE POLICY "Anyone can view achievements" ON public.vendor_achievements
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage achievements" ON public.vendor_achievements
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for user_vendor_achievements
CREATE POLICY "Anyone can view vendor achievements" ON public.user_vendor_achievements
  FOR SELECT USING (true);

CREATE POLICY "System can award achievements" ON public.user_vendor_achievements
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update progress" ON public.user_vendor_achievements
  FOR UPDATE USING (true);

-- RLS Policies for vendor_followers
CREATE POLICY "Anyone can view followers" ON public.vendor_followers
  FOR SELECT USING (true);

CREATE POLICY "Users can follow vendors" ON public.vendor_followers
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow vendors" ON public.vendor_followers
  FOR DELETE USING (auth.uid() = follower_id);

-- RLS Policies for post_likes
CREATE POLICY "Anyone can view likes" ON public.post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can like posts" ON public.post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts" ON public.post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for post_comments
CREATE POLICY "Anyone can view comments" ON public.post_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON public.post_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON public.post_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.post_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update post stats
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.vendor_posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.vendor_posts 
    SET likes_count = GREATEST(0, likes_count - 1) 
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.vendor_posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.vendor_posts 
    SET comments_count = GREATEST(0, comments_count - 1) 
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
CREATE TRIGGER trigger_update_post_likes
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

CREATE TRIGGER trigger_update_post_comments
AFTER INSERT OR DELETE ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Insert default vendor achievements
INSERT INTO public.vendor_achievements (name, description, icon, badge_color, requirement_type, requirement_value, points_reward) VALUES
('First Sale', 'Complete your first order', '🎉', 'bronze', 'orders', 1, 50),
('Rising Star', 'Reach 10 orders', '⭐', 'silver', 'orders', 10, 100),
('Top Seller', 'Complete 50 orders', '🏆', 'gold', 'orders', 50, 250),
('Sales Champion', 'Complete 100 orders', '👑', 'platinum', 'orders', 100, 500),
('5-Star Master', 'Achieve 5.0 rating', '⭐⭐⭐⭐⭐', 'gold', 'rating', 5, 200),
('Product Pro', 'List 50 products', '📦', 'silver', 'products', 50, 150),
('Inventory King', 'List 100 products', '👑', 'platinum', 'products', 100, 300),
('Customer Favorite', 'Get 50 reviews', '❤️', 'gold', 'reviews', 50, 200),
('Social Star', 'Gain 100 followers', '🌟', 'gold', 'followers', 100, 250)
ON CONFLICT DO NOTHING;