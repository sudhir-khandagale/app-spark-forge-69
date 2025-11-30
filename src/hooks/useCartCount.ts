import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useCartCount = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchCartCount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCount(0);
        return;
      }

      // Get cart
      const { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!cart) {
        setCount(0);
        return;
      }

      // Count items in cart
      const { count: itemCount } = await supabase
        .from('cart_items')
        .select('*', { count: 'exact', head: true })
        .eq('cart_id', cart.id);

      setCount(itemCount || 0);
    };

    fetchCartCount();

    // Subscribe to cart changes
    const channel = supabase
      .channel('cart-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cart_items',
        },
        () => {
          fetchCartCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return count;
};
