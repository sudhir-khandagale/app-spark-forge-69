import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useFavoriteStores = () => {
  const [favoriteStoreIds, setFavoriteStoreIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavoriteStores();
  }, []);

  const fetchFavoriteStores = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('favorite_stores')
        .select('store_id')
        .eq('user_id', user.id);

      if (error) throw error;

      const ids = new Set(data?.map(item => item.store_id) || []);
      setFavoriteStoreIds(ids);
    } catch (error) {
      console.error('Error fetching favorite stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const isFavorite = (storeId: string) => favoriteStoreIds.has(storeId);

  return {
    favoriteStoreIds,
    isFavorite,
    loading,
    refetch: fetchFavoriteStores,
  };
};
