-- Create analytics tracking table for product views and searches
CREATE TABLE IF NOT EXISTS public.product_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'search', 'click', 'add_to_cart', 'reservation')),
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create flash sales table
CREATE TABLE IF NOT EXISTS public.flash_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  original_price NUMERIC NOT NULL,
  sale_price NUMERIC NOT NULL,
  discount_percentage INTEGER GENERATED ALWAYS AS (
    ROUND(((original_price - sale_price) / original_price * 100)::numeric)
  ) STORED,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  max_quantity INTEGER,
  sold_quantity INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT valid_sale_price CHECK (sale_price < original_price),
  CONSTRAINT valid_dates CHECK (ends_at > starts_at)
);

-- Create vendor tier/subscription table
CREATE TABLE IF NOT EXISTS public.vendor_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL UNIQUE REFERENCES stores(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'premium')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  features JSONB DEFAULT '{
    "analytics": false,
    "flash_sales": false,
    "bulk_upload": false,
    "priority_support": false,
    "featured_listing": false
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_analytics
CREATE POLICY "Anyone can insert analytics"
  ON public.product_analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Vendors can view their store analytics"
  ON public.product_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = product_analytics.store_id
      AND stores.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all analytics"
  ON public.product_analytics FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for flash_sales
CREATE POLICY "Anyone can view active flash sales"
  ON public.flash_sales FOR SELECT
  USING (
    active = true 
    AND now() BETWEEN starts_at AND ends_at
    AND EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = flash_sales.store_id
      AND stores.status = 'approved'
    )
  );

CREATE POLICY "Vendors can manage their flash sales"
  ON public.flash_sales FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = flash_sales.store_id
      AND stores.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all flash sales"
  ON public.flash_sales FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for vendor_subscriptions
CREATE POLICY "Vendors can view their subscription"
  ON public.vendor_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = vendor_subscriptions.store_id
      AND stores.owner_id = auth.uid()
    )
  );

CREATE POLICY "System can manage subscriptions"
  ON public.vendor_subscriptions FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Indexes for performance
CREATE INDEX idx_product_analytics_product_store ON public.product_analytics(product_id, store_id);
CREATE INDEX idx_product_analytics_created_at ON public.product_analytics(created_at DESC);
CREATE INDEX idx_product_analytics_event_type ON public.product_analytics(event_type);
CREATE INDEX idx_flash_sales_store_active ON public.flash_sales(store_id, active);
CREATE INDEX idx_flash_sales_dates ON public.flash_sales(starts_at, ends_at);

-- Function to track product views
CREATE OR REPLACE FUNCTION track_product_view(
  p_product_id UUID,
  p_store_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO product_analytics (product_id, store_id, event_type, user_id)
  VALUES (p_product_id, p_store_id, 'view', p_user_id);
END;
$$;

-- Function to get vendor analytics summary
CREATE OR REPLACE FUNCTION get_vendor_analytics(
  p_store_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_views BIGINT,
  total_searches BIGINT,
  total_clicks BIGINT,
  total_reservations BIGINT,
  top_products JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT 
      COUNT(*) FILTER (WHERE event_type = 'view') as views,
      COUNT(*) FILTER (WHERE event_type = 'search') as searches,
      COUNT(*) FILTER (WHERE event_type = 'click') as clicks,
      COUNT(*) FILTER (WHERE event_type = 'reservation') as reservations
    FROM product_analytics
    WHERE store_id = p_store_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL
  ),
  top_prods AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'product_id', pa.product_id,
        'product_name', p.name,
        'view_count', COUNT(*)
      ) ORDER BY COUNT(*) DESC
    ) FILTER (WHERE pa.event_type = 'view') as products
    FROM product_analytics pa
    JOIN products p ON p.id = pa.product_id
    WHERE pa.store_id = p_store_id
    AND pa.created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY pa.product_id, p.name
    LIMIT 5
  )
  SELECT 
    COALESCE(s.views, 0)::BIGINT,
    COALESCE(s.searches, 0)::BIGINT,
    COALESCE(s.clicks, 0)::BIGINT,
    COALESCE(s.reservations, 0)::BIGINT,
    COALESCE(tp.products, '[]'::jsonb)
  FROM stats s, top_prods tp;
END;
$$;

-- Trigger to update flash_sales updated_at
CREATE TRIGGER update_flash_sales_updated_at
  BEFORE UPDATE ON public.flash_sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendor_subscriptions_updated_at
  BEFORE UPDATE ON public.vendor_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();