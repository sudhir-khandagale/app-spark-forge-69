import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VendorSubscription {
  tier: 'free' | 'pro' | 'premium';
  storeCount: number;
  productCount: number;
  storeLimits: {
    free: number;
    pro: number;
    premium: number;
  };
  productLimits: {
    free: number;
    pro: number;
    premium: number;
  };
  canAccessAnalytics: boolean;
  canAccessFlashSales: boolean;
  canAccessBulkUpload: boolean;
  isAdmin: boolean;
}

export const useVendorSubscription = (userId?: string, storeId?: string) => {
  const [subscription, setSubscription] = useState<VendorSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchSubscription();
    }
  }, [userId, storeId]);

  const fetchSubscription = async () => {
    try {
      setLoading(true);

      // Check if user is admin
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      const isAdmin = roleData?.role === 'admin';

      // Count stores owned by vendor
      const { count: storeCount } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userId);

      // Get highest subscription tier across all stores
      const { data: subscriptions } = await supabase
        .from('vendor_subscriptions')
        .select('tier, store_id')
        .in('store_id', 
          await supabase
            .from('stores')
            .select('id')
            .eq('owner_id', userId)
            .then(res => res.data?.map(s => s.id) || [])
        );

      // Determine highest tier (premium > pro > free)
      let tier: 'free' | 'pro' | 'premium' = 'free';
      if (subscriptions && subscriptions.length > 0) {
        if (subscriptions.some(s => s.tier === 'premium')) {
          tier = 'premium';
        } else if (subscriptions.some(s => s.tier === 'pro')) {
          tier = 'pro';
        }
      }

      // If storeId provided, get product count for that specific store
      let productCount = 0;
      if (storeId) {
        const { count } = await supabase
          .from('inventory')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', storeId);
        productCount = count || 0;
      }

      const subscriptionData: VendorSubscription = {
        tier: isAdmin ? 'premium' : tier, // Admins get premium features
        storeCount: storeCount || 0,
        productCount,
        storeLimits: {
          free: 1,
          pro: 3,
          premium: 5
        },
        productLimits: {
          free: 100,
          pro: 200,
          premium: 500
        },
        canAccessAnalytics: isAdmin || tier === 'pro' || tier === 'premium',
        canAccessFlashSales: isAdmin || tier === 'pro' || tier === 'premium',
        canAccessBulkUpload: isAdmin || tier === 'pro' || tier === 'premium',
        isAdmin
      };

      setSubscription(subscriptionData);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  return { subscription, loading, refreshSubscription: fetchSubscription };
};
