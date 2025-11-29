import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserStatistics } from "@/hooks/useUserStatistics";
import { Clock, DollarSign, ShoppingBag, Target, TrendingUp, Store } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const ShoppingStatistics = () => {
  const { statistics, loading } = useUserStatistics();

  const stats = [
    {
      icon: Clock,
      label: "Time Saved",
      value: statistics ? `${Math.round(statistics.time_saved_minutes / 60)}h ${statistics.time_saved_minutes % 60}m` : "0h 0m",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      icon: DollarSign,
      label: "Money Saved",
      value: statistics ? `₹${statistics.money_saved_estimate.toFixed(0)}` : "₹0",
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    {
      icon: Store,
      label: "Shops Supported",
      value: statistics?.shops_discovered || 0,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    {
      icon: Target,
      label: "Success Rate",
      value: statistics ? `${statistics.success_rate}%` : "0%",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    },
    {
      icon: ShoppingBag,
      label: "Products Found",
      value: statistics?.products_found || 0,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10"
    },
    {
      icon: TrendingUp,
      label: "Successful Finds",
      value: statistics?.successful_finds || 0,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10"
    }
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Shopping Impact</CardTitle>
        <CardDescription>
          See the difference you're making by shopping local
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="flex flex-col p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
              >
                <div className={`w-10 h-10 rounded-full ${stat.bgColor} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Additional Stats */}
        <div className="mt-6 pt-6 border-t">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Total Searches</div>
              <div className="text-xl font-semibold">{statistics?.searches_made || 0}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Reviews Written</div>
              <div className="text-xl font-semibold">{statistics?.reviews_written || 0}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
