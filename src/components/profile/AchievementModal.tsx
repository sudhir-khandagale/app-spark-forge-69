import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Lock, Award } from "lucide-react";

interface AchievementModalProps {
  achievement: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AchievementModal = ({ achievement, open, onOpenChange }: AchievementModalProps) => {
  if (!achievement) return null;

  const { achievement: ach, progress, is_unlocked, unlocked_at } = achievement;

  const getTierColor = (tier: string) => {
    const colors = {
      bronze: "text-orange-700",
      silver: "text-gray-500",
      gold: "text-yellow-500",
      legendary: "text-purple-500"
    };
    return colors[tier as keyof typeof colors] || colors.bronze;
  };

  const progressPercentage = Math.min((progress / ach.requirement_count) * 100, 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="text-7xl filter" style={{ 
              filter: is_unlocked ? 'none' : 'grayscale(100%)' 
            }}>
              {ach.icon}
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            {is_unlocked ? (
              <span className="flex items-center justify-center gap-2">
                <Trophy className={`w-6 h-6 ${getTierColor(ach.tier)}`} />
                {ach.name}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Lock className="w-6 h-6 text-muted-foreground" />
                {ach.name}
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {ach.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Tier Badge */}
          <div className="flex justify-center">
            <Badge 
              variant={is_unlocked ? "default" : "secondary"}
              className="capitalize text-sm px-4 py-1"
            >
              {ach.tier} Tier
            </Badge>
          </div>

          {/* Progress */}
          {!is_unlocked && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Progress</span>
                <span className="text-muted-foreground">
                  {progress}/{ach.requirement_count}
                </span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              <p className="text-xs text-muted-foreground text-center">
                {ach.requirement_count - progress} more to unlock!
              </p>
            </div>
          )}

          {/* Unlocked Date */}
          {is_unlocked && unlocked_at && (
            <div className="bg-primary/5 rounded-lg p-4 text-center">
              <Award className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">
                Unlocked on {new Date(unlocked_at).toLocaleDateString()}
              </p>
            </div>
          )}

          {/* Points Reward */}
          {ach.points_reward > 0 && (
            <div className="text-center p-3 bg-accent/20 rounded-lg">
              <p className="text-sm font-semibold text-primary">
                🎁 Reward: +{ach.points_reward} points
              </p>
            </div>
          )}

          {/* Category */}
          <div className="text-center text-sm text-muted-foreground">
            Category: <span className="capitalize font-medium">{ach.category}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
