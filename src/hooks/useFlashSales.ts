import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FlashSale {
  id: string;
  product_id: string;
  store_id: string;
  original_price: number;
  sale_price: number;
  discount_percentage: number;
  ends_at: string;
}

export const useFlashSales = (productIds?: string[]) => {
  const [flashSales, setFlashSales] = useState<Map<string, FlashSale>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlashSales();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('flash-sales-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'flash_sales'
        },
        () => {
          fetchFlashSales();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productIds]);

  const fetchFlashSales = async () => {
    try {
      let query = supabase
        .from('flash_sales')
        .select('*')
        .eq('active', true)
        .lte('starts_at', new Date().toISOString())
        .gte('ends_at', new Date().toISOString());

      if (productIds && productIds.length > 0) {
        query = query.in('product_id', productIds);
      }

      const { data, error } = await query;

      if (error) throw error;

      const salesMap = new Map<string, FlashSale>();
      data?.forEach(sale => {
        // Only keep the best deal per product
        const existing = salesMap.get(sale.product_id);
        if (!existing || sale.discount_percentage > existing.discount_percentage) {
          salesMap.set(sale.product_id, sale);
        }
      });

      setFlashSales(salesMap);
    } catch (error) {
      console.error('Error fetching flash sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFlashSale = (productId: string): FlashSale | undefined => {
    return flashSales.get(productId);
  };

  return { flashSales, getFlashSale, loading };
};
