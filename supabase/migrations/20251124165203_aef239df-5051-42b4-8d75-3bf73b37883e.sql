-- Remove the purchase requirement constraint from product_reviews table
ALTER TABLE public.product_reviews 
DROP CONSTRAINT IF EXISTS check_user_purchased_product;