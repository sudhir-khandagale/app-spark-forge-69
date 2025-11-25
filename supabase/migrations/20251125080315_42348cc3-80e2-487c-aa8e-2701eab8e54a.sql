-- Fix search_path for get_vendor_analytics function
CREATE OR REPLACE FUNCTION public.get_vendor_analytics(p_store_id uuid, p_days integer DEFAULT 30)
 RETURNS TABLE(total_views bigint, total_searches bigint, total_clicks bigint, total_reservations bigint, top_products json)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  start_date TIMESTAMP;
BEGIN
  start_date := NOW() - (p_days || ' days')::INTERVAL;
  
  RETURN QUERY
  WITH analytics_data AS (
    SELECT
      COALESCE(SUM(CASE WHEN event_type = 'view' THEN 1 ELSE 0 END), 0) AS views,
      COALESCE(SUM(CASE WHEN event_type = 'search' THEN 1 ELSE 0 END), 0) AS searches,
      COALESCE(SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END), 0) AS clicks,
      0::BIGINT AS reservations
    FROM product_analytics
    WHERE store_id = p_store_id
      AND created_at >= start_date
  ),
  reservation_count AS (
    SELECT COALESCE(COUNT(*), 0) AS res_count
    FROM reservations
    WHERE store_id = p_store_id
      AND created_at >= start_date
  ),
  top_product_views AS (
    SELECT
      pa.product_id,
      p.name AS product_name,
      COUNT(*) AS view_count
    FROM product_analytics pa
    INNER JOIN products p ON p.id = pa.product_id
    WHERE pa.store_id = p_store_id
      AND pa.event_type = 'view'
      AND pa.created_at >= start_date
    GROUP BY pa.product_id, p.name
    ORDER BY view_count DESC
    LIMIT 5
  )
  SELECT
    ad.views,
    ad.searches,
    ad.clicks,
    rc.res_count,
    COALESCE(
      (SELECT json_agg(
        json_build_object(
          'product_id', product_id,
          'product_name', product_name,
          'view_count', view_count
        )
      ) FROM top_product_views),
      '[]'::json
    ) AS top_products
  FROM analytics_data ad, reservation_count rc;
END;
$function$;