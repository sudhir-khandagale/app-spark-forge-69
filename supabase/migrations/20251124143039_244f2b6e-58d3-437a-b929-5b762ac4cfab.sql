-- Add function to check if user has purchased/reserved the product
CREATE OR REPLACE FUNCTION user_has_purchased_product(
  p_user_id UUID,
  p_product_id UUID,
  p_store_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM reservations
    WHERE user_id = p_user_id
      AND product_id = p_product_id
      AND store_id = p_store_id
      AND status IN ('completed', 'confirmed')
  )
$$;

-- Update RLS policy for product reviews to require purchase
DROP POLICY IF EXISTS "Users can create their own product reviews" ON public.product_reviews;

CREATE POLICY "Users can create product reviews if purchased"
  ON public.product_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND user_has_purchased_product(user_id, product_id, store_id)
  );

-- Add helpful error constraint
ALTER TABLE product_reviews 
ADD CONSTRAINT check_user_purchased_product 
CHECK (user_has_purchased_product(user_id, product_id, store_id));

-- Update award points function to only award to customers
CREATE OR REPLACE FUNCTION award_review_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role_type app_role;
BEGIN
  -- Check if user is a customer
  SELECT role INTO user_role_type
  FROM user_roles
  WHERE user_id = NEW.user_id;
  
  -- Only award points to customers
  IF user_role_type = 'customer' THEN
    PERFORM award_points(
      NEW.user_id,
      10,
      'review',
      'Posted a product review',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;