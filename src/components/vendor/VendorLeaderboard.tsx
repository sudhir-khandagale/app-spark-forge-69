import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, Star, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  rank: number;
  vendor_id: string;
  store_id: string;
  total_sales: number;
  total_orders: number;
  average_rating: number;
  response_time_minutes: number;
  store: {
    name: string;
    photo_urls: string[];
  };
}

export default function VendorLeaderboard() {
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'alltime'>('weekly');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_leaderboard_cache')
        .select(`
          *,
          store:stores(name, photo_urls)
        `)
        .eq('period', period)
        .order('rank', { ascending: true })
        .limit(10);

      if (error) throw error;
      setLeaderboard((data as any) || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500"><Trophy className="h-3 w-3 mr-1" /> 1st</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400"><Trophy className="h-3 w-3 mr-1" /> 2nd</Badge>;
    if (rank === 3) return <Badge className="bg-orange-600"><Trophy className="h-3 w-3 mr-1" /> 3rd</Badge>;
    return <Badge variant="outline">{rank}th</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Vendor Leaderboard
        </CardTitle>
        <CardDescription>Top performing vendors this period</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="alltime">All Time</TabsTrigger>
          </TabsList>

          <TabsContent value={period} className="space-y-4 mt-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading rankings...</div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No rankings available yet
              </div>
            ) : (
              leaderboard.map((entry) => (
                <div 
                  key={entry.vendor_id} 
                  className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div>{getRankBadge(entry.rank)}</div>
                  
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={entry.store.photo_urls?.[0]} />
                    <AvatarFallback>{entry.store.name[0]}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{entry.store.name}</h4>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        ₹{entry.total_sales.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {entry.average_rating.toFixed(1)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {entry.response_time_minutes}m
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold">{entry.total_orders}</div>
                    <div className="text-xs text-muted-foreground">orders</div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
