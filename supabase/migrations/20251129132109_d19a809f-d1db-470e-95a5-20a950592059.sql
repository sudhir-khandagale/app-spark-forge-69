-- =====================================================
-- ENHANCED PROFILE SYSTEM - FULL IMPLEMENTATION
-- Integrates with existing user_points & points_transactions
-- =====================================================

-- Create user_levels table
CREATE TABLE IF NOT EXISTS public.user_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 5),
  level_name TEXT NOT NULL DEFAULT 'New Explorer',
  current_points INTEGER NOT NULL DEFAULT 0,
  next_level_points INTEGER NOT NULL DEFAULT 51,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Create achievements table (badge definitions)
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('explorer', 'finder', 'supporter', 'speed', 'community')),
  tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'legendary')),
  requirement_type TEXT NOT NULL,
  requirement_count INTEGER NOT NULL,
  points_reward INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(name)
);

-- Create user_achievements table (earned badges)
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  progress INTEGER DEFAULT 0,
  notified BOOLEAN DEFAULT false,
  UNIQUE(user_id, achievement_id)
);

-- Create user_activity table (track all actions)
CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('search', 'find', 'shop_visit', 'shop_discovery', 'review', 'share', 'referral', 'quick_find')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON public.user_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created ON public.user_activity(created_at DESC);

-- Create user_statistics table (aggregated stats)
CREATE TABLE IF NOT EXISTS public.user_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shops_discovered INTEGER DEFAULT 0,
  products_found INTEGER DEFAULT 0,
  searches_made INTEGER DEFAULT 0,
  successful_finds INTEGER DEFAULT 0,
  reviews_written INTEGER DEFAULT 0,
  time_saved_minutes INTEGER DEFAULT 0,
  money_saved_estimate DECIMAL(10,2) DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_active_date DATE DEFAULT CURRENT_DATE,
  join_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Create user_preferences table (personalization)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shopping_interests TEXT[] DEFAULT ARRAY[]::TEXT[],
  preferred_shop_types TEXT[] DEFAULT ARRAY[]::TEXT[],
  profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private', 'friends')),
  activity_sharing BOOLEAN DEFAULT true,
  showcase_achievements UUID[] DEFAULT ARRAY[]::UUID[],
  theme_preference TEXT DEFAULT 'auto' CHECK (theme_preference IN ('light', 'dark', 'auto')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Create user_friends table (social connections)
CREATE TABLE IF NOT EXISTS public.user_friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

CREATE INDEX IF NOT EXISTS idx_user_friends_status ON public.user_friends(user_id, status);

-- Create leaderboard_cache table (performance optimization)
CREATE TABLE IF NOT EXISTS public.leaderboard_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area_code TEXT,
  rank INTEGER NOT NULL,
  points INTEGER NOT NULL,
  level INTEGER NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('weekly', 'monthly', 'alltime')),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_period_rank ON public.leaderboard_cache(period, rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_period ON public.leaderboard_cache(user_id, period);

-- Enable RLS on all new tables
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_levels
CREATE POLICY "Users can view their own level"
  ON public.user_levels FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own level"
  ON public.user_levels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update user levels"
  ON public.user_levels FOR UPDATE
  USING (true);

-- RLS Policies for achievements (public read, admin write)
CREATE POLICY "Anyone can view achievements"
  ON public.achievements FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage achievements"
  ON public.achievements FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view friends achievements"
  ON public.user_achievements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_friends
      WHERE user_id = auth.uid() 
      AND friend_id = user_achievements.user_id 
      AND status = 'accepted'
    )
  );

CREATE POLICY "System can award achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update achievements"
  ON public.user_achievements FOR UPDATE
  USING (true);

-- RLS Policies for user_activity
CREATE POLICY "Users can view their own activity"
  ON public.user_activity FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can log their own activity"
  ON public.user_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity"
  ON public.user_activity FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_statistics
CREATE POLICY "Users can view their own statistics"
  ON public.user_statistics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public statistics"
  ON public.user_statistics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_preferences
      WHERE user_id = user_statistics.user_id
      AND profile_visibility = 'public'
    )
  );

CREATE POLICY "Users can insert their own statistics"
  ON public.user_statistics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update statistics"
  ON public.user_statistics FOR UPDATE
  USING (true);

-- RLS Policies for user_preferences
CREATE POLICY "Users can manage their own preferences"
  ON public.user_preferences FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for user_friends
CREATE POLICY "Users can view their own friends"
  ON public.user_friends FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can send friend requests"
  ON public.user_friends FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their friend requests"
  ON public.user_friends FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their friendships"
  ON public.user_friends FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- RLS Policies for leaderboard_cache
CREATE POLICY "Anyone can view leaderboard"
  ON public.leaderboard_cache FOR SELECT
  USING (true);

CREATE POLICY "System can manage leaderboard"
  ON public.leaderboard_cache FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- DATABASE FUNCTIONS
-- =====================================================

-- Function: Calculate user level based on points
CREATE OR REPLACE FUNCTION public.calculate_user_level(p_user_id UUID)
RETURNS TABLE(level INTEGER, level_name TEXT, next_level_points INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_points INTEGER;
BEGIN
  -- Get total points from existing user_points table
  SELECT COALESCE(balance, 0) INTO total_points
  FROM public.user_points
  WHERE user_id = p_user_id;
  
  -- Determine level based on points
  IF total_points >= 1000 THEN
    RETURN QUERY SELECT 5, 'Shopping Guru'::TEXT, 9999;
  ELSIF total_points >= 501 THEN
    RETURN QUERY SELECT 4, 'City Champion'::TEXT, 1000;
  ELSIF total_points >= 201 THEN
    RETURN QUERY SELECT 3, 'Neighborhood Pro'::TEXT, 501;
  ELSIF total_points >= 51 THEN
    RETURN QUERY SELECT 2, 'Local Shopper'::TEXT, 201;
  ELSE
    RETURN QUERY SELECT 1, 'New Explorer'::TEXT, 51;
  END IF;
END;
$$;

-- Function: Update user statistics
CREATE OR REPLACE FUNCTION public.update_user_statistics(
  p_user_id UUID,
  p_activity_type TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update statistics
  INSERT INTO public.user_statistics (user_id, last_active_date)
  VALUES (p_user_id, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE SET
    shops_discovered = CASE WHEN p_activity_type = 'shop_discovery' THEN user_statistics.shops_discovered + 1 ELSE user_statistics.shops_discovered END,
    products_found = CASE WHEN p_activity_type = 'find' THEN user_statistics.products_found + 1 ELSE user_statistics.products_found END,
    searches_made = CASE WHEN p_activity_type = 'search' THEN user_statistics.searches_made + 1 ELSE user_statistics.searches_made END,
    successful_finds = CASE WHEN p_activity_type = 'find' THEN user_statistics.successful_finds + 1 ELSE user_statistics.successful_finds END,
    reviews_written = CASE WHEN p_activity_type = 'review' THEN user_statistics.reviews_written + 1 ELSE user_statistics.reviews_written END,
    time_saved_minutes = CASE WHEN p_activity_type = 'find' THEN user_statistics.time_saved_minutes + COALESCE((p_metadata->>'time_saved')::INTEGER, 15) ELSE user_statistics.time_saved_minutes END,
    money_saved_estimate = CASE WHEN p_activity_type = 'find' THEN user_statistics.money_saved_estimate + COALESCE((p_metadata->>'money_saved')::DECIMAL, 0) ELSE user_statistics.money_saved_estimate END,
    last_active_date = CURRENT_DATE,
    updated_at = now();
    
  -- Update streak
  PERFORM public.update_streak(p_user_id);
END;
$$;

-- Function: Update daily streak
CREATE OR REPLACE FUNCTION public.update_streak(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_date DATE;
  current_streak_val INTEGER;
  longest_streak_val INTEGER;
BEGIN
  SELECT last_active_date, current_streak, longest_streak
  INTO last_date, current_streak_val, longest_streak_val
  FROM public.user_statistics
  WHERE user_id = p_user_id;
  
  IF last_date IS NULL THEN
    RETURN;
  END IF;
  
  -- Check if streak continues
  IF last_date = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Increment streak
    UPDATE public.user_statistics
    SET current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        updated_at = now()
    WHERE user_id = p_user_id;
    
    -- Award weekly streak bonus
    IF (current_streak_val + 1) % 7 = 0 THEN
      PERFORM public.award_points(p_user_id, 25, 'weekly_streak', 'Completed 7-day streak!', NULL);
    END IF;
  ELSIF last_date < CURRENT_DATE - INTERVAL '1 day' THEN
    -- Streak broken, reset
    UPDATE public.user_statistics
    SET current_streak = 1,
        updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
END;
$$;

-- Function: Check and award achievements
CREATE OR REPLACE FUNCTION public.check_and_award_achievements(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  achievement_record RECORD;
  user_stat RECORD;
  user_progress INTEGER;
BEGIN
  -- Get user statistics
  SELECT * INTO user_stat
  FROM public.user_statistics
  WHERE user_id = p_user_id;
  
  IF user_stat IS NULL THEN
    RETURN;
  END IF;
  
  -- Loop through all achievements
  FOR achievement_record IN 
    SELECT * FROM public.achievements
  LOOP
    -- Determine progress based on requirement type
    user_progress := 0;
    
    CASE achievement_record.requirement_type
      WHEN 'shops_discovered' THEN
        user_progress := user_stat.shops_discovered;
      WHEN 'products_found' THEN
        user_progress := user_stat.products_found;
      WHEN 'reviews_written' THEN
        user_progress := user_stat.reviews_written;
      WHEN 'successful_finds' THEN
        user_progress := user_stat.successful_finds;
      WHEN 'friends_count' THEN
        SELECT COUNT(*) INTO user_progress
        FROM public.user_friends
        WHERE (user_id = p_user_id OR friend_id = p_user_id) AND status = 'accepted';
      WHEN 'streak_days' THEN
        user_progress := user_stat.current_streak;
      ELSE
        user_progress := 0;
    END CASE;
    
    -- Check if achievement should be unlocked
    IF user_progress >= achievement_record.requirement_count THEN
      -- Insert achievement if not already earned
      INSERT INTO public.user_achievements (user_id, achievement_id, progress, notified)
      VALUES (p_user_id, achievement_record.id, user_progress, false)
      ON CONFLICT (user_id, achievement_id) DO UPDATE
      SET progress = user_progress,
          updated_at = now();
      
      -- Award points for achievement
      IF achievement_record.points_reward > 0 THEN
        PERFORM public.award_points(
          p_user_id,
          achievement_record.points_reward,
          'achievement',
          'Unlocked: ' || achievement_record.name,
          achievement_record.id
        );
      END IF;
    ELSE
      -- Update progress for locked achievements
      INSERT INTO public.user_achievements (user_id, achievement_id, progress)
      VALUES (p_user_id, achievement_record.id, user_progress)
      ON CONFLICT (user_id, achievement_id) DO UPDATE
      SET progress = user_progress;
    END IF;
  END LOOP;
END;
$$;

-- Function: Sync user level with points
CREATE OR REPLACE FUNCTION public.sync_user_level(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  level_info RECORD;
  total_points INTEGER;
BEGIN
  -- Get current points
  SELECT COALESCE(balance, 0) INTO total_points
  FROM public.user_points
  WHERE user_id = p_user_id;
  
  -- Calculate level
  SELECT * INTO level_info
  FROM public.calculate_user_level(p_user_id);
  
  -- Update or insert user level
  INSERT INTO public.user_levels (user_id, level, level_name, current_points, next_level_points)
  VALUES (p_user_id, level_info.level, level_info.level_name, total_points, level_info.next_level_points)
  ON CONFLICT (user_id) DO UPDATE
  SET level = level_info.level,
      level_name = level_info.level_name,
      current_points = total_points,
      next_level_points = level_info.next_level_points,
      updated_at = now();
      
  -- Award level-up bonus if level changed
  IF (SELECT level FROM public.user_levels WHERE user_id = p_user_id) > 
     COALESCE((SELECT level FROM public.user_levels WHERE user_id = p_user_id FOR UPDATE), 0) THEN
    PERFORM public.award_points(p_user_id, 50, 'level_up', 'Reached ' || level_info.level_name, NULL);
  END IF;
END;
$$;

-- Function: Get local leaderboard
CREATE OR REPLACE FUNCTION public.get_local_leaderboard(
  p_latitude DECIMAL,
  p_longitude DECIMAL,
  p_radius_km INTEGER DEFAULT 10,
  p_period TEXT DEFAULT 'alltime',
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  rank INTEGER,
  points INTEGER,
  level INTEGER,
  level_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH nearby_users AS (
    SELECT 
      p.id,
      p.display_name,
      p.avatar_url,
      up.balance as points,
      ul.level,
      ul.level_name,
      s.latitude,
      s.longitude
    FROM public.profiles p
    JOIN public.user_points up ON up.user_id = p.id
    LEFT JOIN public.user_levels ul ON ul.user_id = p.id
    LEFT JOIN LATERAL (
      SELECT latitude, longitude
      FROM public.stores
      WHERE owner_id = p.id
      LIMIT 1
    ) s ON true
    WHERE up.balance > 0
  )
  SELECT 
    nu.id,
    nu.display_name,
    nu.avatar_url,
    ROW_NUMBER() OVER (ORDER BY nu.points DESC)::INTEGER as rank,
    nu.points,
    COALESCE(nu.level, 1),
    COALESCE(nu.level_name, 'New Explorer')
  FROM nearby_users nu
  ORDER BY nu.points DESC
  LIMIT p_limit;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger: Update user level when points change
CREATE OR REPLACE FUNCTION public.trigger_sync_user_level()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.sync_user_level(NEW.user_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_user_points_change
AFTER INSERT OR UPDATE ON public.user_points
FOR EACH ROW
EXECUTE FUNCTION public.trigger_sync_user_level();

-- Trigger: Update statistics and check achievements on activity
CREATE OR REPLACE FUNCTION public.trigger_process_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update statistics
  PERFORM public.update_user_statistics(NEW.user_id, NEW.activity_type, NEW.metadata);
  
  -- Check achievements
  PERFORM public.check_and_award_achievements(NEW.user_id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_user_activity_insert
AFTER INSERT ON public.user_activity
FOR EACH ROW
EXECUTE FUNCTION public.trigger_process_activity();

-- Trigger: Initialize user profile data
CREATE OR REPLACE FUNCTION public.trigger_init_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Initialize user_levels
  INSERT INTO public.user_levels (user_id, level, level_name, current_points, next_level_points)
  VALUES (NEW.id, 1, 'New Explorer', 0, 51)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Initialize user_statistics
  INSERT INTO public.user_statistics (user_id, join_date)
  VALUES (NEW.id, now())
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Initialize user_preferences
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.trigger_init_user_profile();