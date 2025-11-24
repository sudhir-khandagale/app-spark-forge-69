import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Minus, Plus, ShoppingBag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import BottomNav from '@/components/BottomNav';
import { formatPrice } from '@/lib/utils';

interface CartItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    image_url: string | null;
  };
  store: {
    id: string;
    name: string;
  };
}

const Cart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartId, setCartId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCart = async () => {
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

      if (cart) {
        setCartId(cart.id);

        // Fetch cart items with product and store details
        const { data: items, error } = await supabase
          .from('cart_items')
          .select(`
            id,
            quantity,
            price,
            product_id,
            store_id,
            products (id, name, image_url),
            stores (id, name)
          `)
          .eq('cart_id', cart.id);

        if (error) throw error;

        const formattedItems = items?.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          product: {
            id: item.product_id,
            name: (item.products as any)?.name || 'Unknown Product',
            image_url: (item.products as any)?.image_url || null,
          },
          store: {
            id: item.store_id,
            name: (item.stores as any)?.name || 'Unknown Store',
          },
        })) || [];

        setCartItems(formattedItems);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast({
        title: 'Error',
        description: 'Failed to load cart',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId);

      if (error) throw error;

      setCartItems(items =>
        items.map(item =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update quantity',
        variant: 'destructive',
      });
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setCartItems(items => items.filter(item => item.id !== itemId));
      toast({
        title: 'Success',
        description: 'Item removed from cart',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove item',
        variant: 'destructive',
      });
    }
  };

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen pb-16">
        <p className="text-muted-foreground">Loading cart...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-16">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-4 p-4 max-w-lg mx-auto">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Shopping Cart</h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4">
        <div className="max-w-lg mx-auto space-y-4">
          {cartItems.length === 0 ? (
            <Card className="p-8 text-center">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-4">
                Start adding items to your cart
              </p>
              <Link to="/">
                <Button>Start Shopping</Button>
              </Link>
            </Card>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-3">
                {cartItems.map(item => (
                  <Card key={item.id} className="p-4">
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <Link to={`/product/${item.product.id}`} className="flex-shrink-0">
                        {item.product.image_url ? (
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                            <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </Link>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <Link to={`/product/${item.product.id}`}>
                          <h3 className="font-semibold mb-1 line-clamp-2 hover:text-primary">
                            {item.product.name}
                          </h3>
                        </Link>
                        <Link to={`/store/${item.store.id}`}>
                          <p className="text-sm text-muted-foreground mb-2 hover:text-primary">
                            {item.store.name}
                          </p>
                        </Link>
                        <p className="text-lg font-bold text-primary">
                          {formatPrice(item.price)}
                        </p>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="w-5 h-5 text-destructive" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Cart Summary */}
              <Card className="p-4 sticky bottom-20">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(totalPrice)}</span>
                  </div>
                </div>
                <Button className="w-full" size="lg">
                  Proceed to Checkout
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Items can be picked up from respective stores
                </p>
              </Card>
            </>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Cart;
