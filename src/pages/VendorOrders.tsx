import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { useVendorSubscription } from '@/hooks/useVendorSubscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BackButton } from '@/components/BackButton';
import RoleBasedBottomNav from '@/components/RoleBasedBottomNav';
import LockedFeatureOverlay from '@/components/LockedFeatureOverlay';
import SubscriptionTiersModal from '@/components/SubscriptionTiersModal';
import { Package, Search, Filter, TrendingUp, Clock, CheckCircle2, MessageSquare, FileText, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import OrderNotes from '@/components/OrderNotes';

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  payment_status: string;
  delivery_status: string;
  items: any;
  delivery_time_slot: string | null;
  estimated_delivery: string | null;
  tracking_number: string | null;
  user_id: string;
  delivery_address: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  } | null;
  customerName?: string;
  customerPhone?: string;
}

export default function VendorOrders() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isVendor, isAdmin } = useUserRole();
  const { subscription } = useVendorSubscription(user?.id);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stores, setStores] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [editingTracking, setEditingTracking] = useState<{ [key: string]: string }>({});
  const [notesOrderId, setNotesOrderId] = useState<string | null>(null);
  const [generatingInvoice, setGeneratingInvoice] = useState<string | null>(null);

  useEffect(() => {
    if (user && (isVendor || isAdmin)) {
      fetchStoreAndOrders();
    }
  }, [user, isVendor, isAdmin, selectedStoreId]);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter]);

  const fetchStoreAndOrders = async () => {
    try {
      // Get all user's stores
      const { data: storesData, error: storeError } = await supabase
        .from('stores')
        .select('id, name')
        .eq('owner_id', user?.id)
        .eq('status', 'approved');

      if (storeError) throw storeError;

      if (!storesData || storesData.length === 0) {
        toast({
          title: 'No Store Found',
          description: 'Please register your store first',
          variant: 'destructive',
        });
        navigate('/onboarding/merchant');
        return;
      }

      setStores(storesData);
      
      // Set selected store if not already set
      const activeStoreId = selectedStoreId || storesData[0].id;
      if (!selectedStoreId) {
        setSelectedStoreId(activeStoreId);
      }

      // Fetch orders with customer info for the selected store
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', activeStoreId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch customer profiles for each order
      if (ordersData && ordersData.length > 0) {
        const userIds = [...new Set(ordersData.map(order => order.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, phone')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        const ordersWithCustomerInfo = ordersData.map(order => ({
          ...order,
          delivery_address: order.delivery_address as Order['delivery_address'],
          customerName: profileMap.get(order.user_id)?.display_name,
          customerPhone: profileMap.get(order.user_id)?.phone,
        })) as Order[];

        setOrders(ordersWithCustomerInfo);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load orders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.delivery_status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ delivery_status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Status Updated',
        description: `Order status changed to ${newStatus.replace(/_/g, ' ')}`,
      });

      fetchStoreAndOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      });
    }
  };

  const updateTrackingNumber = async (orderId: string) => {
    const trackingNumber = editingTracking[orderId];
    if (!trackingNumber?.trim()) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ tracking_number: trackingNumber.trim() })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Tracking Updated',
        description: 'Tracking number saved successfully',
      });

      setEditingTracking(prev => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });

      fetchStoreAndOrders();
    } catch (error) {
      console.error('Error updating tracking:', error);
      toast({
        title: 'Error',
        description: 'Failed to update tracking number',
        variant: 'destructive',
      });
    }
  };

  const generateInvoice = async (orderId: string) => {
    setGeneratingInvoice(orderId);
    try {
      const { data, error } = await supabase.functions.invoke('generate-invoice', {
        body: { orderId },
      });

      if (error) throw error;

      if (data?.invoice?.html) {
        // Open invoice in new window for printing
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(data.invoice.html);
          printWindow.document.close();
          
          toast({
            title: 'Invoice Generated',
            description: 'Invoice opened in new window',
          });
        }
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate invoice',
        variant: 'destructive',
      });
    } finally {
      setGeneratingInvoice(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-500/10 text-green-600';
      case 'out_for_delivery':
        return 'bg-blue-500/10 text-blue-600';
      case 'shipped':
      case 'processing':
        return 'bg-yellow-500/10 text-yellow-600';
      case 'confirmed':
        return 'bg-purple-500/10 text-purple-600';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.delivery_status === 'pending').length,
    processing: orders.filter(o => ['confirmed', 'processing', 'shipped'].includes(o.delivery_status)).length,
    completed: orders.filter(o => o.delivery_status === 'delivered').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <BackButton fallbackPath="/vendor/dashboard" />
            <div>
              <h1 className="text-2xl font-bold">{t('order_management')}</h1>
              <p className="text-sm text-muted-foreground">{t('manage_store_orders')}</p>
            </div>
          </div>
          
          {stores.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Store:</span>
              <Select value={selectedStoreId || undefined} onValueChange={setSelectedStoreId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select store" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </header>

      <main className="p-4 space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-primary" />
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <p className="text-2xl font-bold">{stats.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
                <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <p className="text-xs text-muted-foreground">Processing</p>
                </div>
                <p className="text-2xl font-bold text-blue-500">{stats.processing}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search by order ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Orders</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No orders found</p>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">
                        Order #{order.id.slice(0, 8)}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(order.created_at), 'MMM dd, yyyy • hh:mm a')}
                      </p>
                    </div>
                    <Badge className={cn(getStatusColor(order.delivery_status))}>
                      {order.delivery_status?.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Customer Info */}
                  <div className="space-y-2 pb-3 border-b">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer Details</p>
                    {order.customerName && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Name: </span>
                        <span className="font-medium">{order.customerName}</span>
                      </div>
                    )}
                    {order.customerPhone && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Phone: </span>
                        <a href={`tel:${order.customerPhone}`} className="font-medium text-primary hover:underline">
                          {order.customerPhone}
                        </a>
                      </div>
                    )}
                    {order.delivery_address && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Address: </span>
                        <span className="font-medium">
                          {order.delivery_address.address}, {order.delivery_address.city}, {order.delivery_address.state} - {order.delivery_address.pincode}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Order Info */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Amount</span>
                    <span className="font-bold">₹{order.total_amount.toFixed(2)}</span>
                  </div>

                  {order.delivery_time_slot && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Delivery Slot: </span>
                      <span className="font-medium">{order.delivery_time_slot}</span>
                    </div>
                  )}

                  {/* Tracking Number */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tracking Number</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter tracking number"
                        value={editingTracking[order.id] ?? order.tracking_number ?? ''}
                        onChange={(e) => setEditingTracking(prev => ({ ...prev, [order.id]: e.target.value }))}
                        className="flex-1"
                      />
                      {(editingTracking[order.id] !== undefined && editingTracking[order.id] !== order.tracking_number) && (
                        <Button 
                          size="sm" 
                          onClick={() => updateTrackingNumber(order.id)}
                        >
                          Save
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-wrap pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setNotesOrderId(order.id)}
                      className="gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Notes
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => generateInvoice(order.id)}
                      disabled={generatingInvoice === order.id}
                      className="gap-2"
                    >
                      {generatingInvoice === order.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                      Invoice
                    </Button>
                    {order.delivery_status === 'pending' && (
                      <Button size="sm" onClick={() => updateOrderStatus(order.id, 'confirmed')}>
                        Confirm
                      </Button>
                    )}
                    {order.delivery_status === 'confirmed' && (
                      <Button size="sm" onClick={() => updateOrderStatus(order.id, 'processing')}>
                        Start Processing
                      </Button>
                    )}
                    {order.delivery_status === 'processing' && (
                      <Button size="sm" onClick={() => updateOrderStatus(order.id, 'shipped')}>
                        Mark Shipped
                      </Button>
                    )}
                    {order.delivery_status === 'shipped' && (
                      <Button size="sm" onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}>
                        Out for Delivery
                      </Button>
                    )}
                    {order.delivery_status === 'out_for_delivery' && (
                      <Button size="sm" onClick={() => updateOrderStatus(order.id, 'delivered')}>
                        Mark Delivered
                      </Button>
                    )}
                    {!['delivered', 'cancelled'].includes(order.delivery_status) && (
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </main>

      {/* Order Notes Dialog */}
      <Dialog open={!!notesOrderId} onOpenChange={(open) => !open && setNotesOrderId(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Communication</DialogTitle>
          </DialogHeader>
          {notesOrderId && user && (
            <OrderNotes orderId={notesOrderId} isVendor={true} userId={user.id} />
          )}
        </DialogContent>
      </Dialog>

      {/* Subscription Modal */}
      {selectedStoreId && (
        <SubscriptionTiersModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          storeId={selectedStoreId}
          currentTier={subscription?.tier || 'free'}
          onUpgrade={() => {
            setShowUpgradeModal(false);
            fetchStoreAndOrders();
          }}
        />
      )}

      <RoleBasedBottomNav />
    </div>
  );
}