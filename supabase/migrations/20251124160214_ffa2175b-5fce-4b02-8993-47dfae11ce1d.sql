-- Create function to get effective subscription features including admin override
CREATE OR REPLACE FUNCTION public.get_subscription_features(p_store_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_is_admin boolean;
  v_subscription_features jsonb;
  v_tier text;
BEGIN
  -- Get store owner
  SELECT owner_id INTO v_owner_id
  FROM stores
  WHERE id = p_store_id;
  
  -- Check if owner is admin
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = v_owner_id AND role = 'admin'
  ) INTO v_is_admin;
  
  -- If admin, return all features enabled
  IF v_is_admin THEN
    RETURN jsonb_build_object(
      'analytics', true,
      'flash_sales', true,
      'bulk_upload', true,
      'priority_support', true,
      'featured_listing', true
    );
  END IF;
  
  -- Otherwise get subscription features
  SELECT features, tier INTO v_subscription_features, v_tier
  FROM vendor_subscriptions
  WHERE store_id = p_store_id;
  
  -- If no subscription found or free tier, return free features
  IF v_subscription_features IS NULL OR v_tier = 'free' THEN
    RETURN jsonb_build_object(
      'analytics', false,
      'flash_sales', false,
      'bulk_upload', false,
      'priority_support', false,
      'featured_listing', false
    );
  END IF;
  
  RETURN v_subscription_features;
END;
$$;