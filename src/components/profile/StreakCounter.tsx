import { Card, CardContent } from "@/components/ui/card";
import { useStreak } from "@/hooks/useStreak";
import { Flame, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const StreakCounter = () => {
  const { streakInfo, loading } = useStreak();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!streakInfo) return null;

  return (
    <Card className="bg-gradient-to-br from-orange-500/10 via-red-500/10 to-pink-500/10">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          {/* Current Streak */}
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center">
              <Flame className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="text-3xl font-bold">
                {streakInfo.current_streak}
              </div>
              <div className="text-sm text-muted-foreground">
                Day Streak
              </div>
            </div>
          </div>

          {/* Best Streak */}
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 mb-1">
              <Award className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Best</span>
            </div>
            <div className="text-2xl font-bold text-primary">
              {streakInfo.longest_streak}
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            {streakInfo.is_active_today ? (
              <span className="flex items-center gap-1 text-green-500 font-semibold">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                Active today!
              </span>
            ) : (
              <span className="text-orange-500 font-semibold">
                Visit a shop today to keep the streak!
              </span>
            )}
          </div>
        </div>

        {/* Milestone */}
        {streakInfo.current_streak >= 7 && (
          <div className="mt-3 p-3 bg-primary/10 rounded-lg text-center">
            <p className="text-xs font-semibold text-primary">
              🎉 {Math.floor(streakInfo.current_streak / 7)} week streak! Keep it up!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
