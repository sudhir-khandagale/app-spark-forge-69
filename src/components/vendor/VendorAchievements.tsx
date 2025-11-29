import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Lock, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

interface Achievement {
  achievement: {
    name: string;
    description: string;
    icon: string;
    badge_color: string;
    requirement_value: number;
  };
  unlocked_at: string | null;
  progress: number;
}

interface VendorAchievementsProps {
  achievements: Achievement[];
}

export const VendorAchievements = ({ achievements }: VendorAchievementsProps) => {
  const unlockedCount = achievements.filter(a => a.unlocked_at).length;

  const getBadgeColor = (color: string) => {
    const colors: Record<string, string> = {
      bronze: 'bg-gradient-to-r from-amber-600 to-amber-800',
      silver: 'bg-gradient-to-r from-slate-300 to-slate-500',
      gold: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
      platinum: 'bg-gradient-to-r from-purple-400 to-purple-600',
    };
    return colors[color] || 'bg-gradient-to-r from-primary to-primary/80';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Achievements
          </CardTitle>
          <Badge variant="secondary" className="text-lg">
            {unlockedCount}/{achievements.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {achievements.map((achievement, index) => (
            <motion.div
              key={achievement.achievement.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`relative overflow-hidden ${
                achievement.unlocked_at 
                  ? 'border-2 border-primary shadow-lg' 
                  : 'opacity-60'
              }`}>
                {achievement.unlocked_at ? (
                  <div className={`absolute inset-0 ${getBadgeColor(achievement.achievement.badge_color)} opacity-10`} />
                ) : (
                  <div className="absolute top-2 right-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                
                <CardContent className="p-4 text-center space-y-2">
                  <div className="text-4xl mb-2">{achievement.achievement.icon}</div>
                  <h4 className="font-semibold text-sm line-clamp-2">
                    {achievement.achievement.name}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {achievement.achievement.description}
                  </p>
                  
                  {!achievement.unlocked_at && (
                    <div className="space-y-1">
                      <Progress 
                        value={(achievement.progress / achievement.achievement.requirement_value) * 100} 
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground">
                        {achievement.progress}/{achievement.achievement.requirement_value}
                      </p>
                    </div>
                  )}

                  {achievement.unlocked_at && (
                    <Badge 
                      className={`${getBadgeColor(achievement.achievement.badge_color)} text-white`}
                    >
                      Unlocked!
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
