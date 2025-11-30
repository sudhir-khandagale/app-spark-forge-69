import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Search, MousePointer, ShoppingBag, TrendingUp } from 'lucide-react';
import { useVendorAnalytics } from '@/hooks/useVendorAnalytics';

interface VendorAnalyticsDashboardProps {
  storeId: string;
  subscriptionTier?: string;
  isLocked?: boolean;
}

export default function VendorAnalyticsDashboard({ 
  storeId, 
  subscriptionTier = 'free',
  isLocked = false 
}: VendorAnalyticsDashboardProps) {
  const { analytics, loading } = useVendorAnalytics(storeId, 30);

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
    </div>
  );
}
