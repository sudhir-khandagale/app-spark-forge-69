import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, TrendingUp, Gift } from 'lucide-react';
import { useRewards } from '@/hooks/useRewards';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

export default function RewardsDisplay() {
  const { points, transactions, loading } = useRewards();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!points) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          <CardTitle>Rewards Points</CardTitle>
        </div>
        <CardDescription>Earn points for reviews and other activities</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Current Balance</p>
            <p className="text-3xl font-bold text-primary">{points.balance}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Lifetime Earned</p>
            <p className="text-3xl font-bold">{points.lifetime_points}</p>
          </div>
        </div>

        {transactions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Recent Activity</p>
            </div>
            <div className="space-y-2">
              {transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge variant={transaction.points > 0 ? 'default' : 'secondary'}>
                    {transaction.points > 0 ? '+' : ''}{transaction.points}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">Ways to Earn Points</p>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 ml-6">
            <li>• Write a product review: 10 points</li>
            <li>• More ways to earn coming soon!</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
