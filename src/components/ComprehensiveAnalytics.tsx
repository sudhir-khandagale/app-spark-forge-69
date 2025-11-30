import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, Search, MousePointer, ShoppingBag, TrendingUp, TrendingDown, 
  DollarSign, Users, Calendar, Package, Star, BarChart3, PieChart, Activity
} from 'lucide-react';
import { useVendorAnalytics } from '@/hooks/useVendorAnalytics';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay } from 'date-fns';

interface ComprehensiveAnalyticsProps {
  storeId: string;
}

interface OrderStats {
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  completed_orders: number;
  pending_orders: number;
}

interface DailySales {
  date: string;
  revenue: number;
  orders: number;
}

export default function ComprehensiveAnalytics({ storeId }: ComprehensiveAnalyticsProps) {
  const { analytics, loading: analyticsLoading } = useVendorAnalytics(storeId, 30);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderData();
  }, [storeId]);

  const fetchOrderData = async () => {
    try {
      setLoading(true);
      
      // Fetch orders for the last 30 days
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', storeId)
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate order statistics
      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount || 0), 0) || 0;
      const completedOrders = orders?.filter(o => o.payment_status === 'completed').length || 0;
      const pendingOrders = orders?.filter(o => o.payment_status === 'pending').length || 0;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      setOrderStats({
        total_orders: totalOrders,
        total_revenue: totalRevenue,
        avg_order_value: avgOrderValue,
        completed_orders: completedOrders,
        pending_orders: pendingOrders
      });

      // Calculate daily sales for chart
      const salesByDate: { [key: string]: { revenue: number; orders: number } } = {};
      
      for (let i = 29; i >= 0; i--) {
        const date = format(startOfDay(subDays(new Date(), i)), 'MMM dd');
        salesByDate[date] = { revenue: 0, orders: 0 };
      }

      orders?.forEach(order => {
        const date = format(new Date(order.created_at), 'MMM dd');
        if (salesByDate[date]) {
          salesByDate[date].revenue += Number(order.total_amount || 0);
          salesByDate[date].orders += 1;
        }
      });

      const salesData = Object.entries(salesByDate).map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders
      }));

      setDailySales(salesData);

      // Calculate top products from orders
      const productCounts: { [key: string]: { name: string; count: number; revenue: number } } = {};
      
      orders?.forEach(order => {
        if (Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            const key = item.product_id || item.name;
            if (!productCounts[key]) {
              productCounts[key] = { name: item.name, count: 0, revenue: 0 };
            }
            productCounts[key].count += item.quantity || 1;
            productCounts[key].revenue += (item.price || 0) * (item.quantity || 1);
          });
        }
      });

      const topProductsData = Object.entries(productCounts)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setTopProducts(topProductsData);

    } catch (error) {
      console.error('Error fetching order data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || analyticsLoading) {
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

  const conversionRate = analytics && analytics.total_views > 0 
    ? ((orderStats?.total_orders || 0) / analytics.total_views * 100).toFixed(1)
    : '0.0';

  const avgRevenuePerDay = orderStats ? orderStats.total_revenue / 30 : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">₹{orderStats?.total_revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg ₹{avgRevenuePerDay.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/day
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{orderStats?.total_orders || 0}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-600">
                    {orderStats?.completed_orders || 0} completed
                  </Badge>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-bold">₹{orderStats?.avg_order_value.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{conversionRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">Views to orders</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales Trends</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">User Engagement</CardTitle>
                </div>
                <CardDescription>How customers interact with your store</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Eye className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Store Views</span>
                  </div>
                  <span className="font-semibold">{analytics?.total_views.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Search className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Product Searches</span>
                  </div>
                  <span className="font-semibold">{analytics?.total_searches.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MousePointer className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">Product Clicks</span>
                  </div>
                  <span className="font-semibold">{analytics?.total_clicks.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">Reservations</span>
                  </div>
                  <span className="font-semibold">{analytics?.total_reservations.toLocaleString() || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Order Status</CardTitle>
                </div>
                <CardDescription>Current order breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Completed Orders</span>
                    <span className="font-semibold">{orderStats?.completed_orders || 0}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-600 transition-all"
                      style={{ 
                        width: `${orderStats?.total_orders ? (orderStats.completed_orders / orderStats.total_orders * 100) : 0}%` 
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Pending Orders</span>
                    <span className="font-semibold">{orderStats?.pending_orders || 0}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-600 transition-all"
                      style={{ 
                        width: `${orderStats?.total_orders ? (orderStats.pending_orders / orderStats.total_orders * 100) : 0}%` 
                      }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Orders</span>
                    <span className="text-2xl font-bold">{orderStats?.total_orders || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <CardTitle>Sales Trend (Last 30 Days)</CardTitle>
              </div>
              <CardDescription>Daily revenue and order volume</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Simple bar chart visualization */}
                <div className="space-y-2">
                  {dailySales.slice(-7).map((day, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{day.date}</span>
                        <div className="flex gap-4">
                          <span className="font-medium">₹{day.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                          <span className="text-muted-foreground">{day.orders} orders</span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all"
                          style={{ 
                            width: `${Math.max(5, (day.revenue / Math.max(...dailySales.map(d => d.revenue)) * 100))}%` 
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      ₹{dailySales.reduce((sum, day) => sum + day.revenue, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Revenue</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {dailySales.reduce((sum, day) => sum + day.orders, 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Orders</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      ₹{(dailySales.reduce((sum, day) => sum + day.revenue, 0) / 30).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-muted-foreground">Avg per Day</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Top Selling Products</CardTitle>
                </div>
                <CardDescription>By revenue generated</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.count} sold</p>
                        </div>
                      </div>
                      <span className="font-semibold text-green-600">
                        ₹{product.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  ))}
                  {topProducts.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No sales data yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Most Viewed Products</CardTitle>
                </div>
                <CardDescription>By user interest</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.top_products.map((product: any, index: number) => (
                    <div key={product.product_id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 font-semibold text-sm">
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
                  {(!analytics?.top_products || analytics.top_products.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">No view data yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
