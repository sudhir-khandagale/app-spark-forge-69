import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import RoleBasedBottomNav from '@/components/RoleBasedBottomNav';
import { formatPrice } from '@/lib/utils';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const productId = searchParams.get('product');
  const storeId = searchParams.get('store');
  const fromCart = searchParams.get('from') === 'cart';

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [storeSettings, setStoreSettings] = useState<any>(null);

  useEffect(() => {
    fetchItems();
    loadRazorpayScript();
  }, []);

  const loadRazorpayScript = () => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  };

  const fetchItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      if (fromCart) {
        // Fetch cart items
        const { data: cart } = await supabase
          .from('carts')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (cart) {
          const { data: cartItems } = await supabase
            .from('cart_items')
            .select(`
              id, quantity, price, product_id, store_id,
              products (id, name, image_url),
              stores (id, name)
            `)
            .eq('cart_id', cart.id);

          setItems(cartItems || []);
        }
      } else if (productId && storeId) {
        // Fetch single product
        const { data: product } = await supabase
          .from('products')
          .select('id, name, image_url')
          .eq('id', productId)
          .single();

        const { data: inventory } = await supabase
          .from('inventory')
          .select('price')
          .eq('product_id', productId)
          .eq('store_id', storeId)
          .single();

        const { data: store } = await supabase
          .from('stores')
          .select('id, name')
          .eq('id', storeId)
          .single();

        if (product && inventory && store) {
          setItems([{
            id: 'temp',
            quantity: 1,
            price: inventory.price,
            product_id: productId,
            store_id: storeId,
            products: product,
            stores: store,
          }]);
        }
      }

      // Fetch store delivery settings
      if (storeId) {
        const { data: storeData } = await supabase
          .from('stores')
          .select('offers_delivery, delivery_charges, cod_available')
          .eq('id', storeId)
          .single();
        
        setStoreSettings(storeData);
        
        // Set default delivery type based on store settings
        if (!storeData?.offers_delivery) {
          setDeliveryType('pickup');
        }
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load checkout items',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryCharges = (deliveryType === 'delivery' && storeSettings?.offers_delivery) 
    ? (storeSettings.delivery_charges || 0) 
    : 0;
  const totalAmount = subtotal + deliveryCharges;

  const handleCheckout = async () => {
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create order in database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          store_id: items[0].store_id,
          items: items.map(item => ({
            product_id: item.product_id,
            name: item.products.name,
            quantity: item.quantity,
            price: item.price,
          })),
          total_amount: totalAmount,
          delivery_address: deliveryType === 'delivery' ? { address } : null,
          delivery_charges: deliveryCharges,
          payment_method: paymentMethod,
          notes,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // If COD, skip Razorpay and complete order directly
      if (paymentMethod === 'cod') {
        await supabase
          .from('orders')
          .update({
            payment_status: 'cod_pending',
          })
          .eq('id', order.id);

        // Clear cart if from cart
        if (fromCart) {
          const { data: cart } = await supabase
            .from('carts')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (cart) {
            await supabase
              .from('cart_items')
              .delete()
              .eq('cart_id', cart.id);
          }
        }

        // Award points
        await supabase.rpc('award_points', {
          p_user_id: user.id,
          p_points: 20,
          p_action_type: 'purchase',
          p_description: 'Completed COD purchase',
        });

        toast({
          title: 'Order Placed Successfully!',
          description: 'Pay when you receive your order.',
        });

        navigate(`/payment-success?order=${order.id}`);
        return;
      }

      // Create Razorpay order via edge function
      const { data: razorpayOrder } = await supabase.functions.invoke('razorpay-order', {
        body: {
          amount: totalAmount * 100, // Convert to paise
          orderId: order.id,
        },
      });

      // Open Razorpay checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: 'INR',
        order_id: razorpayOrder.id,
        name: 'Flowdux',
        description: 'Order Payment',
        handler: async (response: any) => {
          // Update order with payment details
          await supabase
            .from('orders')
            .update({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              payment_status: 'completed',
            })
            .eq('id', order.id);

          // Clear cart if from cart
          if (fromCart) {
            const { data: cart } = await supabase
              .from('carts')
              .select('id')
              .eq('user_id', user.id)
              .single();

            if (cart) {
              await supabase
                .from('cart_items')
                .delete()
                .eq('cart_id', cart.id);
            }
          }

          // Award points
          await supabase.rpc('award_points', {
            p_user_id: user.id,
            p_points: 20,
            p_action_type: 'purchase',
            p_description: 'Completed purchase',
          });

          navigate(`/payment-success?order=${order.id}`);
        },
        prefill: {
          email: user.email,
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to process checkout',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading checkout...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-16">
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-4 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Checkout</h1>
        </div>
      </header>

      <main className="flex-1 p-4">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Order Summary */}
          <Card className="p-4">
            <h2 className="font-semibold mb-3">Order Summary</h2>
            <div className="space-y-2 mb-4">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{item.products.name} x{item.quantity}</span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {deliveryCharges > 0 && (
                <div className="flex justify-between text-sm text-primary">
                  <span>Delivery Charges</span>
                  <span>+{formatPrice(deliveryCharges)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span className="text-primary">{formatPrice(totalAmount)}</span>
              </div>
            </div>
          </Card>

          {/* Delivery Type */}
          <Card className="p-4">
            <Label className="font-semibold mb-3 block">Delivery Method</Label>
            <RadioGroup value={deliveryType} onValueChange={(value: any) => setDeliveryType(value)}>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="pickup" id="pickup" />
                <Label htmlFor="pickup">Pickup from Store</Label>
              </div>
              {storeSettings?.offers_delivery && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery">
                    Home Delivery {storeSettings.delivery_charges > 0 && `(₹${storeSettings.delivery_charges})`}
                  </Label>
                </div>
              )}
            </RadioGroup>

            {deliveryType === 'delivery' && (
              <div className="mt-4 space-y-2">
                <Label htmlFor="address">Delivery Address</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your delivery address"
                  rows={3}
                />
              </div>
            )}
          </Card>

          {/* Payment Method */}
          <Card className="p-4">
            <Label className="font-semibold mb-3 block">💳 Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
              <div className="flex items-center space-x-2 mb-3 p-3 border rounded-lg">
                <RadioGroupItem value="online" id="online" />
                <div className="flex-1">
                  <Label htmlFor="online" className="font-medium">Pay Online (Razorpay)</Label>
                  <p className="text-xs text-muted-foreground">Credit/Debit Card, UPI, Net Banking</p>
                </div>
              </div>
              {storeSettings?.cod_available && (
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="cod" id="cod" />
                  <div className="flex-1">
                    <Label htmlFor="cod" className="font-medium">Cash on Delivery (COD)</Label>
                    <p className="text-xs text-muted-foreground">Pay when you receive the order</p>
                  </div>
                </div>
              )}
            </RadioGroup>
          </Card>

          {/* Additional Notes */}
          <Card className="p-4">
            <Label htmlFor="notes" className="font-semibold mb-3 block">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions?"
              rows={2}
            />
          </Card>

          {/* Checkout Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleCheckout}
            disabled={processing || (deliveryType === 'delivery' && !address.trim())}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            {processing ? 'Processing...' : `Pay ${formatPrice(totalAmount)}`}
          </Button>
        </div>
      </main>

      <RoleBasedBottomNav />
    </div>
  );
};

export default Checkout;