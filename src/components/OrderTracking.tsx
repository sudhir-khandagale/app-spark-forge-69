import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Clock, Package, Truck, Home, X, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface OrderTrackingProps {
  orderId: string;
}

const statusFlow = [
  { key: 'pending', label: 'Order Placed', icon: Package },
  { key: 'confirmed', label: 'Confirmed', icon: Check },
  { key: 'processing', label: 'Processing', icon: Clock },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: Home },
];

export const OrderTracking = ({ orderId }: OrderTrackingProps) => {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setOrder(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          stores (
            id,
            name,
            phone,
            address
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading tracking info...</p>
        </CardContent>
      </Card>
    );
  }

  if (!order) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <X className="w-12 h-12 mx-auto text-destructive mb-4" />
          <p className="text-muted-foreground">Order not found</p>
        </CardContent>
      </Card>
    );
  }

  const currentStatus = order.delivery_status || 'pending';
  const isCancelled = currentStatus === 'cancelled';
  const currentStepIndex = statusFlow.findIndex(s => s.key === currentStatus);

  const getStatusColor = (status: string) => {
    if (status === 'delivered') return 'bg-green-500';
    if (status === 'cancelled') return 'bg-destructive';
    return 'bg-primary';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Order Tracking</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Order #{order.id.slice(0, 8)}
              </p>
            </div>
            <Badge className={cn(getStatusColor(currentStatus), "text-white")}>
              {currentStatus.replace(/_/g, ' ').toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Delivery Time Slot */}
          {order.delivery_time_slot && (
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">Delivery Time Slot</p>
                <p className="text-sm text-muted-foreground">{order.delivery_time_slot}</p>
              </div>
            </div>
          )}

          {/* Estimated Delivery */}
          {order.estimated_delivery && (
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
              <Truck className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">Estimated Delivery</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(order.estimated_delivery), 'MMM dd, yyyy • hh:mm a')}
                </p>
              </div>
            </div>
          )}

          {/* Status Timeline */}
          <div className="space-y-4">
            {!isCancelled ? (
              statusFlow.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const Icon = step.icon;

                return (
                  <div key={step.key} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                          isCompleted ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      {index < statusFlow.length - 1 && (
                        <div
                          className={cn(
                            "w-0.5 h-12 transition-colors",
                            isCompleted ? "bg-primary" : "bg-muted"
                          )}
                        />
                      )}
                    </div>
                    <div className="flex-1 pb-8">
                      <p className={cn("font-medium", isCurrent && "text-primary")}>
                        {step.label}
                      </p>
                      {isCurrent && (
                        <p className="text-sm text-muted-foreground mt-1">In Progress</p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center gap-4 p-4 bg-destructive/10 rounded-lg">
                <X className="w-8 h-8 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">Order Cancelled</p>
                  <p className="text-sm text-muted-foreground">
                    This order has been cancelled
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Store Contact */}
          {order.stores && (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Store Information</h4>
              <div className="space-y-2">
                <p className="font-medium">{order.stores.name}</p>
                <p className="text-sm text-muted-foreground">{order.stores.address}</p>
                {order.stores.phone && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${order.stores.phone}`}>
                      <Phone className="w-4 h-4 mr-2" />
                      Contact Store
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};