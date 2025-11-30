import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShoppingBag, Store, Calendar, FileText, Truck, Clock } from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { format } from 'date-fns';
import RoleBasedBottomNav from '@/components/RoleBasedBottomNav';
import { useToast } from '@/hooks/use-toast';
import { OrderTracking } from '@/components/OrderTracking';

interface Order {
  id: string;
  store_id: string;
  items: any;
  total_amount: number;
  payment_status: string;
  delivery_status: string | null;
  delivery_time_slot: string | null;
  receipt_number: string | null;
  created_at: string;
  pickup_scheduled: string | null;
  stores: {
    name: string;
    address: string;
  };
}

export default function OrderHistory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          stores (
            name,
            address
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load order history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-600 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
      case 'failed':
        return 'bg-red-500/10 text-red-600 dark:text-red-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const downloadInvoice = async (orderId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-invoice', {
        body: { orderId }
      });

      if (error) throw error;

      if (data?.invoice?.html) {
        const blob = new Blob([data.invoice.html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice_${data.invoice.receiptNumber}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: 'Invoice Downloaded',
          description: 'Your invoice has been downloaded successfully',
        });
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to download invoice',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto p-4 flex items-center gap-3">
          <BackButton fallbackPath="/profile" />
          <div>
            <h1 className="text-2xl font-bold">Order History</h1>
            <p className="text-sm text-muted-foreground">View your past purchases</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start shopping and your orders will appear here
              </p>
              <Button onClick={() => navigate('/')}>
                Start Shopping
              </Button>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <Store className="w-5 h-5" />
                      {order.stores.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(order.created_at), 'MMM dd, yyyy • hh:mm a')}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(order.payment_status)}>
                    {order.payment_status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Order Items</h4>
                  {Array.isArray(order.items) ? (
                    order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="font-medium">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))
                  ) : null}
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Amount</span>
                  <span className="text-xl font-bold">₹{order.total_amount.toFixed(2)}</span>
                </div>

                {order.pickup_scheduled && (
                  <div className="text-sm text-muted-foreground">
                    Pickup scheduled: {format(new Date(order.pickup_scheduled), 'MMM dd, yyyy • hh:mm a')}
                  </div>
                )}

                {/* Delivery Info */}
                {order.delivery_status && (
                  <div className="flex items-center gap-2 text-sm">
                    <Truck className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="secondary">
                      {order.delivery_status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                )}

                {order.delivery_time_slot && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">Delivery Slot:</span>
                    <span className="font-medium">{order.delivery_time_slot}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setTrackingOrderId(order.id)}
                  >
                    <Truck className="w-4 h-4 mr-2" />
                    Track Order
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => downloadInvoice(order.id)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Invoice
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>

      {/* Order Tracking Dialog */}
      <Dialog open={!!trackingOrderId} onOpenChange={() => setTrackingOrderId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Order Tracking</DialogTitle>
          </DialogHeader>
          {trackingOrderId && <OrderTracking orderId={trackingOrderId} />}
        </DialogContent>
      </Dialog>

      <RoleBasedBottomNav />
    </div>
  );
}
