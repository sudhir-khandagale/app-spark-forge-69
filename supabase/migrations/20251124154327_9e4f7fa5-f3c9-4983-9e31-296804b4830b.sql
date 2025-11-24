-- Add Razorpay fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS razorpay_customer_id TEXT;

-- Add Razorpay fields to vendor_subscriptions table
ALTER TABLE public.vendor_subscriptions 
ADD COLUMN IF NOT EXISTS razorpay_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_plan_id TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_razorpay_subscription_id 
ON public.vendor_subscriptions(razorpay_subscription_id);

CREATE INDEX IF NOT EXISTS idx_profiles_razorpay_customer_id 
ON public.profiles(razorpay_customer_id);