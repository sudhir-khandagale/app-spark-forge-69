import RoleBasedBottomNav from "@/components/RoleBasedBottomNav";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Trophy, Medal, Award, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/hooks/useTranslation";

const Leaderboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { leaderboard, currentUserRank, loading } = useLeaderboard();

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-orange-600" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-4xl mx-auto p-4 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Trophy className="w-8 h-8 text-yellow-500" />
              {t('leaderboard')}
            </h1>
            {currentUserRank && (
              <p className="text-muted-foreground">{t('your_rank').replace('{rank}', currentUserRank.toString())}</p>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Top Shoppers</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.user_id}
                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="w-12 h-12 flex items-center justify-center">
                      {getRankIcon(entry.rank) || (
                        <Badge variant="outline" className="w-10 h-10 flex items-center justify-center text-lg">
                          {entry.rank}
                        </Badge>
                      )}
                    </div>

                    <Avatar className="w-12 h-12">
                      <AvatarImage src={entry.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                        {entry.display_name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <p className="font-semibold">{entry.display_name || "Anonymous"}</p>
                      <p className="text-sm text-muted-foreground">
                        Level {entry.level} • {entry.level_name}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{entry.points}</p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <RoleBasedBottomNav />
    </div>
  );
};

export default Leaderboard;
