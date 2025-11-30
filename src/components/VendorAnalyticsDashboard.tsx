import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Eye, Search, MousePointer, ShoppingBag, TrendingUp, Package, AlertTriangle, DollarSign } from 'lucide-react';
import { useVendorAnalytics } from '@/hooks/useVendorAnalytics';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

interface VendorAnalyticsDashboardProps {
  storeId: string;
  subscriptionTier?: string;
  isLocked?: boolean;
}

interface InventoryStats {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalValue: number;
  fastMoving: Array<{ name: string; views: number }>;
  slowMoving: Array<{ name: string; quantity: number; lastUpdated: string }>;
}

export default function VendorAnalyticsDashboard({ 
  storeId, 
  subscriptionTier = 'free',
  isLocked = false 
}: VendorAnalyticsDashboardProps) {
  const { analytics, loading } = useVendorAnalytics(storeId, 30);
  const [inventoryStats, setInventoryStats] = useState<InventoryStats | null>(null);
  const [loadingInventory, setLoadingInventory] = useState(true);

  useEffect(() => {
    if (storeId) {
      fetchInventoryStats();
    }
  }, [storeId]);

  const fetchInventoryStats = async () => {
    try {
      const { data: inventory, error } = await supabase
        .from('inventory')
        .select(`
          *,
          products (
            id,
            name,
            category
          )
        `)
        .eq('store_id', storeId);

      if (error) throw error;

      const totalProducts = inventory?.length || 0;
      const lowStockCount = inventory?.filter(i => i.quantity > 0 && i.quantity <= i.low_stock_threshold).length || 0;
      const outOfStockCount = inventory?.filter(i => i.quantity === 0).length || 0;
      const totalValue = inventory?.reduce((sum, item) => sum + (item.quantity * item.price), 0) || 0;

      // Get analytics data for fast moving products
      const { data: analyticsData } = await supabase
        .from('product_analytics')
        .select('product_id, products(name)')
        .eq('store_id', storeId)
        .eq('event_type', 'view')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const productViews = analyticsData?.reduce((acc: Record<string, { name: string; views: number }>, item) => {
        const productName = (item.products as any)?.name || 'Unknown';
        if (!acc[item.product_id]) {
          acc[item.product_id] = { name: productName, views: 0 };
        }
        acc[item.product_id].views++;
        return acc;
      }, {});

      const fastMoving = Object.values(productViews || {})
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);

      // Slow moving: products with high stock and old last_updated
      const slowMoving = inventory
        ?.filter(i => i.quantity > 10)
        .sort((a, b) => new Date(a.last_updated).getTime() - new Date(b.last_updated).getTime())
        .slice(0, 5)
        .map(i => ({
          name: (i.products as any)?.name || 'Unknown',
          quantity: i.quantity,
          lastUpdated: i.last_updated
        })) || [];

      setInventoryStats({
        totalProducts,
        lowStockCount,
        outOfStockCount,
        totalValue,
        fastMoving,
        slowMoving
      });
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
    } finally {
      setLoadingInventory(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Store Analytics</CardTitle>
          <CardDescription>No analytics data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const metrics = [
    {
      label: 'Total Views',
      value: analytics.total_views,
      icon: Eye,
      color: 'text-blue-600'
    },
    {
      label: 'Searches',
      value: analytics.total_searches,
      icon: Search,
      color: 'text-green-600'
    },
    {
      label: 'Clicks',
      value: analytics.total_clicks,
      icon: MousePointer,
      color: 'text-purple-600'
    },
    {
      label: 'Reservations',
      value: analytics.total_reservations,
      icon: ShoppingBag,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>Store Performance (Last 30 Days)</CardTitle>
          </div>
          <CardDescription>Track your store's visibility and engagement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`h-4 w-4 ${metric.color}`} />
                    <span className="text-sm text-muted-foreground">{metric.label}</span>
                  </div>
                  <p className="text-2xl font-bold">{metric.value.toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {analytics.top_products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Viewed Products</CardTitle>
            <CardDescription>Your most popular products this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.top_products.map((product, index) => (
                <div key={product.product_id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {index + 1}
                    </span>
                    <span className="font-medium">{product.product_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{product.view_count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Analytics
          </CardTitle>
          <CardDescription>Stock movement and recommendations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loadingInventory ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : inventoryStats ? (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Stock Value</div>
                  <div className="text-2xl font-bold flex items-center gap-1">
                    <DollarSign className="h-5 w-5" />
                    ₹{inventoryStats.totalValue.toLocaleString()}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Needs Attention</div>
                  <div className="text-2xl font-bold flex items-center gap-1 text-yellow-600">
                    <AlertTriangle className="h-5 w-5" />
                    {inventoryStats.lowStockCount + inventoryStats.outOfStockCount}
                  </div>
                </div>
              </div>

              {/* Fast Moving Products */}
              {inventoryStats.fastMoving.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Fast Moving Products
                  </div>
                  <div className="space-y-2">
                    {inventoryStats.fastMoving.map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm font-medium truncate flex-1">{product.name}</span>
                        <Badge variant="secondary" className="ml-2">
                          {product.views} views
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💡 Consider restocking these popular items to meet demand
                  </p>
                </div>
              )}

              {/* Slow Moving Products */}
              {inventoryStats.slowMoving.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Package className="h-4 w-4 text-yellow-600" />
                    Slow Moving Stock
                  </div>
                  <div className="space-y-2">
                    {inventoryStats.slowMoving.map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{product.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Last updated {new Date(product.lastUpdated).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {product.quantity} units
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💡 Consider running promotions or adjusting pricing for these items
                  </p>
                </div>
              )}

              {/* Restock Alerts */}
              {(inventoryStats.lowStockCount > 0 || inventoryStats.outOfStockCount > 0) && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-medium text-sm">Restock Recommendation</div>
                      <div className="text-xs text-muted-foreground">
                        You have {inventoryStats.lowStockCount} low stock items and {inventoryStats.outOfStockCount} out-of-stock items. 
                        Update inventory to avoid missed sales opportunities.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No inventory data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
