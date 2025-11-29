import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Lock } from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tier: string;
  requirement_count: number;
  points_reward: number;
}

interface AchievementCardProps {
  achievement: Achievement;
  progress: number;
  isUnlocked: boolean;
  onClick?: () => void;
}

export const AchievementCard = ({ 
  achievement, 
  progress, 
  isUnlocked,
  onClick 
}: AchievementCardProps) => {
  const getTierColor = (tier: string) => {
    const colors = {
      bronze: "from-orange-700 to-orange-900",
      silver: "from-gray-400 to-gray-600",
      gold: "from-yellow-400 to-yellow-600",
      legendary: "from-purple-500 via-pink-500 to-purple-700"
    };
    return colors[tier as keyof typeof colors] || colors.bronze;
  };

  const getTierBadgeColor = (tier: string) => {
    const colors = {
      bronze: "bg-orange-700 text-white",
      silver: "bg-gray-400 text-gray-900",
      gold: "bg-yellow-500 text-yellow-900",
      legendary: "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
    };
    return colors[tier as keyof typeof colors] || colors.bronze;
  };

  const progressPercentage = Math.min((progress / achievement.requirement_count) * 100, 100);

  return (
    <Card
      className={`relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 ${
        isUnlocked ? 'bg-gradient-to-br ' + getTierColor(achievement.tier) : 'bg-muted/50'
      }`}
      onClick={onClick}
    >
      <div className="p-4">
        {/* Lock overlay for locked achievements */}
        {!isUnlocked && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
        )}

        {/* Achievement Icon */}
        <div className="text-4xl mb-2 text-center filter" style={{ 
          filter: isUnlocked ? 'none' : 'grayscale(100%)' 
        }}>
          {achievement.icon}
        </div>

        {/* Achievement Info */}
        <div className="text-center mb-2">
          <h4 className={`font-semibold text-sm mb-1 ${isUnlocked ? 'text-white' : 'text-foreground'}`}>
            {achievement.name}
          </h4>
          <p className={`text-xs ${isUnlocked ? 'text-white/80' : 'text-muted-foreground'}`}>
            {achievement.description}
          </p>
        </div>

        {/* Progress or Tier Badge */}
        {isUnlocked ? (
          <div className="flex justify-center">
            <Badge className={getTierBadgeColor(achievement.tier) + " capitalize text-xs"}>
              {achievement.tier}
            </Badge>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{progress}/{achievement.requirement_count}</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        {/* Points Reward */}
        {achievement.points_reward > 0 && (
          <div className="text-center mt-2">
            <span className={`text-xs font-semibold ${isUnlocked ? 'text-white/90' : 'text-primary'}`}>
              +{achievement.points_reward} pts
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};
