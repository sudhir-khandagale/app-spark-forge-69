-- Fix security warnings by setting search_path on functions
CREATE OR REPLACE FUNCTION award_points(
  p_user_id UUID,
  p_points INTEGER,
  p_action_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert or update user points
  INSERT INTO public.user_points (user_id, balance, lifetime_points)
  VALUES (p_user_id, p_points, p_points)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    balance = user_points.balance + p_points,
    lifetime_points = user_points.lifetime_points + p_points,
    updated_at = now();
  
  -- Record transaction
  INSERT INTO public.points_transactions (user_id, points, action_type, description, reference_id)
  VALUES (p_user_id, p_points, p_action_type, p_description, p_reference_id);
END;
$$;

CREATE OR REPLACE FUNCTION award_review_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM award_points(
    NEW.user_id,
    10,
    'review',
    'Posted a product review',
    NEW.id
  );
  RETURN NEW;
END;
$$;