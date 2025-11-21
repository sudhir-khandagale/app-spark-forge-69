import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Store {
  id: string;
  name: string;
  description: string | null;
  address: string;
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  review_count: number | null;
  hours: any;
  photo_urls: string[] | null;
  specialties: string[] | null;
}

export const useStores = (latitude?: number, longitude?: number) => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .order('rating', { ascending: false, nullsFirst: false });

        if (error) throw error;

        setStores(data || []);
      } catch (error: any) {
        console.error('Error fetching stores:', error);
        toast({
          title: 'Error',
          description: 'Failed to load stores',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, [latitude, longitude, toast]);

  return { stores, loading };
};

export const useStore = (storeId: string) => {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .eq('id', storeId)
          .single();

        if (error) throw error;

        setStore(data);
      } catch (error: any) {
        console.error('Error fetching store:', error);
        toast({
          title: 'Error',
          description: 'Failed to load store details',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    if (storeId) {
      fetchStore();
    }
  }, [storeId, toast]);

  return { store, loading };
};

export const useStoreInventory = (storeId: string) => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const { data, error } = await supabase
          .from('inventory')
          .select(`
            *,
            products (
              id,
              name,
              description,
              image_url,
              category
            )
          `)
          .eq('store_id', storeId)
          .eq('in_stock', true)
          .order('last_updated', { ascending: false });

        if (error) throw error;

        setInventory(data || []);

        // Set up realtime subscription for inventory updates
        const channel = supabase
          .channel(`inventory-${storeId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'inventory',
              filter: `store_id=eq.${storeId}`
            },
            (payload) => {
              console.log('Inventory update:', payload);
              // Refetch inventory on any change
              fetchInventory();
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (error: any) {
        console.error('Error fetching inventory:', error);
        toast({
          title: 'Error',
          description: 'Failed to load inventory',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    if (storeId) {
      fetchInventory();
    }
  }, [storeId, toast]);

  return { inventory, loading };
};
