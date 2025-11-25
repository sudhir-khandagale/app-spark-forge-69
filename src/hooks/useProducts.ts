import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  barcode: string | null;
  colors?: string[];
  sizes?: { name: string; measurements: string }[];
}

export interface ProductWithInventory extends Product {
  store_name: string;
  store_id: string;
  price: number;
  in_stock: boolean;
  quantity: number;
  distance?: number;
  store_rating?: number;
  store_address?: string;
  store_latitude?: number;
  store_longitude?: number;
  store_google_maps_link?: string;
}

export const useProductSearch = () => {
  const [results, setResults] = useState<ProductWithInventory[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const searchProducts = async (query: string, latitude?: number, longitude?: number) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-products', {
        body: {
          query,
          latitude,
          longitude,
          maxDistance: 50
        }
      });

      if (error) throw error;

      setResults(data.results || []);
    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: 'Search failed',
        description: error.message || 'Failed to search products',
        variant: 'destructive'
      });
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, searchProducts };
};

export const useProduct = (productId: string, storeId?: string) => {
  const [product, setProduct] = useState<ProductWithInventory | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();

        if (productError) throw productError;

        let query = supabase
          .from('inventory')
          .select(`
            *,
            stores (
              id,
              name,
              address,
              rating,
              latitude,
              longitude,
              google_maps_link
            )
          `)
          .eq('product_id', productId)
          .eq('in_stock', true);

        if (storeId) {
          query = query.eq('store_id', storeId);
        }

        const { data: inventoryData, error: inventoryError } = await query;

        if (inventoryError) throw inventoryError;

        if (inventoryData && inventoryData.length > 0) {
          const inventory = inventoryData[0];
          const store = inventory.stores as any;
          
          setProduct({
            ...productData,
            colors: Array.isArray(productData.colors) ? productData.colors as string[] : [],
            sizes: Array.isArray(productData.sizes) ? productData.sizes as { name: string; measurements: string }[] : [],
            store_name: store.name,
            store_id: store.id,
            store_address: store.address,
            store_rating: store.rating,
            store_latitude: store.latitude,
            store_longitude: store.longitude,
            store_google_maps_link: store.google_maps_link,
            price: inventory.price,
            in_stock: inventory.in_stock || false,
            quantity: inventory.quantity
          });
        } else {
          setProduct({
            ...productData,
            colors: Array.isArray(productData.colors) ? productData.colors as string[] : [],
            sizes: Array.isArray(productData.sizes) ? productData.sizes as { name: string; measurements: string }[] : [],
            store_name: '',
            store_id: '',
            price: 0,
            in_stock: false,
            quantity: 0
          });
        }
      } catch (error: any) {
        console.error('Error fetching product:', error);
        toast({
          title: 'Error',
          description: 'Failed to load product details',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId, storeId, toast]);

  return { product, loading };
};
