import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import VendorAnalyticsDashboard from '@/components/VendorAnalyticsDashboard';
import SubscriptionTiersModal from '@/components/SubscriptionTiersModal';
import { Package, AlertTriangle, Crown, Lock, Store, BarChart } from 'lucide-react';
import { useVendorSubscription } from '@/hooks/useVendorSubscription';
import LockedFeatureOverlay from '@/components/LockedFeatureOverlay';
import { useToast } from '@/hooks/use-toast';
import RoleBasedBottomNav from '@/components/RoleBasedBottomNav';
import { InventoryAssistant } from '@/components/InventoryAssistant';

interface InventorySummary {
  total_products: number;
  low_stock_items: number;
  out_of_stock_items: number;
  total_value: number;
}

interface Store {
  id: string;
  name: string;
  status: string;
  photo_urls?: string[] | null;
}

export default function VendorDashboard() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isVendor, isAdmin, loading: roleLoading } = useUserRole();
  const [stores, setStores] = useState<Store[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [inventorySummary, setInventorySummary] = useState<InventorySummary | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { subscription, loading: subLoading } = useVendorSubscription(user?.id, storeId);

  useEffect(() => {
    if (!roleLoading && user && (isVendor || isAdmin)) {
      if (storeId) {
        fetchStoreData();
      } else {
        fetchAllStores();
      }
    } else if (!roleLoading && !isVendor && !isAdmin) {
      navigate('/');
    }
  }, [user, isVendor, isAdmin, roleLoading, storeId]);

  const fetchAllStores = async () => {
    try {
      const { data: storesData, error } = await supabase
        .from('stores')
        .select('id, name, status, photo_urls')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStores(storesData || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
      toast({
        title: "Error",
        description: "Failed to load stores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreData = async () => {
    if (!storeId) return;

    try {
      // Fetch store details
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('id, name, status, owner_id, photo_urls')
        .eq('id', storeId)
        .single();

      if (storeError) throw storeError;

      // Check authorization
      if (storeData.owner_id !== user?.id && !isAdmin) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view this store.",
          variant: "destructive",
        });
        navigate('/vendor/dashboard');
        return;
      }

      setStore(storeData);

      // Fetch inventory summary
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select('quantity, price, low_stock_threshold')
        .eq('store_id', storeId);

      if (inventoryError) throw inventoryError;

      const summary: InventorySummary = {
        total_products: inventoryData.length,
        low_stock_items: inventoryData.filter(item => item.quantity <= item.low_stock_threshold && item.quantity > 0).length,
        out_of_stock_items: inventoryData.filter(item => item.quantity === 0).length,
        total_value: inventoryData.reduce((sum, item) => sum + (item.quantity * item.price), 0),
      };

      setInventorySummary(summary);

      // Fetch subscription tier
      const { data: subData } = await supabase
        .from('vendor_subscriptions')
        .select('tier')
        .eq('store_id', storeId)
        .single();

      if (subData) {
        setSubscriptionTier(subData.tier);
      }

    } catch (error) {
      console.error('Error fetching store data:', error);
      toast({
        title: "Error",
        description: "Failed to load store data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="p-4">
            <Skeleton className="h-8 w-48" />
          </div>
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Show all stores if no storeId
  if (!storeId) {
    return (
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
          <div className="p-4">
            <h1 className="text-2xl font-bold">My Stores</h1>
            <p className="text-sm text-muted-foreground">Manage your stores and inventory</p>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {stores.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Store className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Stores Yet</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Create your first store to start selling
                </p>
                <Button onClick={() => navigate('/onboarding/merchant')}>
                  Register Store
                </Button>
              </CardContent>
            </Card>
          ) : (
            stores.map((storeItem) => (
              <Card key={storeItem.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {storeItem.photo_urls?.[0] && (
                        <img
                          src={storeItem.photo_urls[0]}
                          alt={storeItem.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <CardTitle className="text-lg">{storeItem.name}</CardTitle>
                        <Badge variant={storeItem.status === 'approved' ? 'default' : 'secondary'} className="mt-1">
                          {storeItem.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate(`/inventory/${storeItem.id}`)}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Inventory
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate(`/vendor/dashboard/${storeItem.id}`)}
                    >
                      <BarChart className="w-4 h-4 mr-2" />
                      Analytics
                    </Button>
                  </div>
                  <Button
                    variant="default"
                    className="w-full mt-2"
                    onClick={() => navigate('/vendor/orders')}
                  >
                    View Orders
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <RoleBasedBottomNav />
      </div>
    );
  }

  if (!store) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/vendor/dashboard')}
            >
              <Store className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{store.name}</h1>
              <p className="text-sm text-muted-foreground">Analytics</p>
            </div>
          </div>
          <Badge variant={subscriptionTier === 'free' ? 'secondary' : 'default'}>
            {subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)}
          </Badge>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Subscription Upgrade Card */}
        {subscription && !subscription.canAccessAnalytics && (
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                <CardTitle>Unlock Premium Features</CardTitle>
              </div>
              <CardDescription>
                Upgrade to Pro to access advanced analytics, flash sales, bulk uploads, and priority support
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span>Analytics Dashboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span>Flash Sales</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span>Bulk Upload</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span>Priority Support</span>
                </div>
              </div>
              <Button onClick={() => setShowUpgradeModal(true)} className="w-full">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Pro
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Inventory Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <CardTitle>Inventory Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{inventorySummary?.total_products || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">₹{inventorySummary?.total_value.toFixed(2) || 0}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <p className="text-sm text-muted-foreground">Low Stock</p>
                </div>
                <p className="text-2xl font-bold text-yellow-500">{inventorySummary?.low_stock_items || 0}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <p className="text-sm text-muted-foreground">Out of Stock</p>
                </div>
                <p className="text-2xl font-bold text-destructive">{inventorySummary?.out_of_stock_items || 0}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => navigate(`/inventory/${storeId}`)}
            >
              Manage Inventory
            </Button>
          </CardContent>
        </Card>

        {/* Analytics */}
        {subscription && (
          <LockedFeatureOverlay
            isLocked={!subscription.canAccessAnalytics}
            onUpgrade={() => setShowUpgradeModal(true)}
            title="Analytics Locked"
            description="Upgrade to Pro or Premium to access detailed analytics and insights"
            requiredTier="pro"
          >
            <VendorAnalyticsDashboard 
              storeId={storeId} 
              subscriptionTier={subscription.tier}
              isLocked={!subscription.canAccessAnalytics}
            />
          </LockedFeatureOverlay>
        )}
      </div>

      {/* Subscription Modal */}
      <SubscriptionTiersModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        storeId={storeId}
        currentTier={subscriptionTier}
        onUpgrade={() => {
          setShowUpgradeModal(false);
          fetchStoreData();
        }}
      />

      {/* AI Assistant */}
      {storeId && <InventoryAssistant storeId={storeId} onInventoryUpdate={fetchStoreData} />}

      <RoleBasedBottomNav />
    </div>
  );
}
