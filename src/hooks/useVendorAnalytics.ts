import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsSummary {
  total_views: number;
  total_searches: number;
  total_clicks: number;
  total_reservations: number;
  top_products: Array<{
    product_id: string;
    product_name: string;
    view_count: number;
  }>;
}

export const useVendorAnalytics = (storeId: string, days: number = 30) => {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (storeId) {
      fetchAnalytics();
    }
  }, [storeId, days]);

  const fetchAnalytics = async () => {
    try {
      const { data, error } = await supabase.rpc('get_vendor_analytics', {
        p_store_id: storeId,
        p_days: days
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const topProducts = Array.isArray(data[0].top_products) 
          ? data[0].top_products as Array<{product_id: string; product_name: string; view_count: number}>
          : [];
          
        setAnalytics({
          total_views: Number(data[0].total_views),
          total_searches: Number(data[0].total_searches),
          total_clicks: Number(data[0].total_clicks),
          total_reservations: Number(data[0].total_reservations),
          top_products: topProducts
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return { analytics, loading, refreshAnalytics: fetchAnalytics };
};
