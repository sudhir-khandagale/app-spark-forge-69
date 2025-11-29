import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserActivity } from "@/hooks/useUserActivity";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, ShoppingBag, Store, Star, Share2, Users, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

export const ActivityFeed = () => {
  const { activities, loading } = useUserActivity(15);

  const getActivityIcon = (type: string) => {
    const icons = {
      search: Search,
      find: ShoppingBag,
      shop_visit: Store,
      shop_discovery: Store,
      review: Star,
      share: Share2,
      referral: Users,
      quick_find: Zap
    };
    return icons[type as keyof typeof icons] || ShoppingBag;
  };

  const getActivityColor = (type: string) => {
    const colors = {
      search: "text-blue-500 bg-blue-500/10",
      find: "text-green-500 bg-green-500/10",
      shop_visit: "text-purple-500 bg-purple-500/10",
      shop_discovery: "text-orange-500 bg-orange-500/10",
      review: "text-yellow-500 bg-yellow-500/10",
      share: "text-pink-500 bg-pink-500/10",
      referral: "text-indigo-500 bg-indigo-500/10",
      quick_find: "text-red-500 bg-red-500/10"
    };
    return colors[type as keyof typeof colors] || "text-gray-500 bg-gray-500/10";
  };

  const getActivityLabel = (type: string, metadata: any) => {
    const labels: Record<string, string> = {
      search: metadata.query ? `Searched for "${metadata.query}"` : "Performed a search",
      find: metadata.product_name ? `Found ${metadata.product_name}` : "Found a product",
      shop_visit: metadata.store_name ? `Visited ${metadata.store_name}` : "Visited a shop",
      shop_discovery: metadata.store_name ? `Discovered ${metadata.store_name}` : "Discovered a new shop",
      review: "Wrote a review",
      share: "Shared a find",
      referral: "Referred a friend",
      quick_find: "Lightning fast find!"
    };
    return labels[type] || "Activity";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your shopping journey starts here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No activity yet. Start exploring local shops!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your latest shopping actions</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {activities.map((activity) => {
              const Icon = getActivityIcon(activity.activity_type);
              const colors = getActivityColor(activity.activity_type);
              const [iconColor, bgColor] = colors.split(' ');

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {getActivityLabel(activity.activity_type, activity.metadata)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
