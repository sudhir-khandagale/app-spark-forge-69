import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import RoleBasedBottomNav from '@/components/RoleBasedBottomNav';

interface WishlistItem {
  id: string;
  created_at: string;
  product: {
    id: string;
    name: string;
    image_url: string | null;
    category: string | null;
    rating: number | null;
  };
  lowestPrice?: number;
  storeCount?: number;
}

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchWishlist = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch favorites with product details
      const { data: favorites, error } = await supabase
        .from('favorites')
        .select(`
          id,
          created_at,
          product_id,
          products (id, name, image_url, category, rating)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get inventory data for each product
      const itemsWithPrices = await Promise.all(
        favorites?.map(async (fav) => {
          const { data: inventory } = await supabase
            .from('inventory')
            .select('price, store_id')
            .eq('product_id', fav.product_id)
            .eq('in_stock', true)
            .order('price', { ascending: true });

          const lowestPrice = inventory?.[0]?.price;
          const storeCount = inventory?.length || 0;

          return {
            id: fav.id,
            created_at: fav.created_at,
            product: {
              id: fav.product_id,
              name: (fav.products as any)?.name || 'Unknown Product',
              image_url: (fav.products as any)?.image_url || null,
              category: (fav.products as any)?.category || null,
              rating: (fav.products as any)?.rating || null,
            },
            lowestPrice,
            storeCount,
          };
        }) || []
      );

      setWishlistItems(itemsWithPrices);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to load wishlist',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const removeFromWishlist = async (favoriteId: string) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;

      setWishlistItems(items => items.filter(item => item.id !== favoriteId));
      toast({
        title: 'Removed from wishlist',
        description: 'Item has been removed from your wishlist',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove item',
        variant: 'destructive',
      });
    }
  };

  const addToCart = async (productId: string, price: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get or create cart
      let { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!cart) {
        const { data: newCart } = await supabase
          .from('carts')
          .insert({ user_id: user.id })
          .select('id')
          .single();
        cart = newCart;
      }

      if (!cart) throw new Error('Failed to create cart');

      // Get first available inventory
      const { data: inventory } = await supabase
        .from('inventory')
        .select('store_id')
        .eq('product_id', productId)
        .eq('in_stock', true)
        .limit(1)
        .single();

      if (!inventory) {
        toast({
          title: 'Out of stock',
          description: 'This item is currently unavailable',
          variant: 'destructive',
        });
        return;
      }

      // Add to cart
      const { error } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cart.id,
          product_id: productId,
          store_id: inventory.store_id,
          quantity: 1,
          price: price,
        });

      if (error) throw error;

      toast({
        title: 'Added to cart',
        description: 'Item has been added to your cart',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add to cart',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen pb-16">
        <p className="text-muted-foreground">Loading wishlist...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-16">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-4 p-4 max-w-lg mx-auto">
          <BackButton fallbackPath="/profile" />
          <h1 className="text-xl font-bold">Wishlist</h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4">
        <div className="max-w-lg mx-auto space-y-4">
          {wishlistItems.length === 0 ? (
            <Card className="p-8 text-center">
              <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
              <p className="text-muted-foreground mb-4">
                Save items you love for later
              </p>
              <Link to="/">
                <Button>Browse Products</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {wishlistItems.map(item => (
                <Card key={item.id} className="overflow-hidden">
                  <Link to={`/product/${item.product.id}`}>
                    {item.product.image_url ? (
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-muted flex items-center justify-center">
                        <Heart className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                  </Link>
                  
                  <div className="p-4 space-y-3">
                    <Link to={`/product/${item.product.id}`}>
                      <h3 className="font-semibold line-clamp-2 hover:text-primary">
                        {item.product.name}
                      </h3>
                    </Link>

                    {item.product.category && (
                      <p className="text-sm text-muted-foreground">
                        {item.product.category}
                      </p>
                    )}

                    {item.product.rating && (
                      <div className="flex items-center gap-1">
                        <span className="text-sm">⭐</span>
                        <span className="text-sm font-medium">
                          {item.product.rating.toFixed(1)}
                        </span>
                      </div>
                    )}

                    {item.lowestPrice && (
                      <p className="text-lg font-bold text-primary">
                        From ${item.lowestPrice.toFixed(2)}
                      </p>
                    )}

                    {item.storeCount && item.storeCount > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Available at {item.storeCount} store{item.storeCount > 1 ? 's' : ''}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        size="sm"
                        onClick={() => item.lowestPrice && addToCart(item.product.id, item.lowestPrice)}
                        disabled={!item.lowestPrice}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removeFromWishlist(item.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <RoleBasedBottomNav />
    </div>
  );
};

export default Wishlist;
