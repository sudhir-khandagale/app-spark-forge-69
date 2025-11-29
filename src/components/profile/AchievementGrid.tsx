import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAchievements } from "@/hooks/useAchievements";
import { AchievementCard } from "./AchievementCard";
import { AchievementModal } from "./AchievementModal";
import { Trophy, Loader2 } from "lucide-react";

export const AchievementGrid = () => {
  const { achievements, unlockedCount, totalCount, loading } = useAchievements();
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const categories = [
    { value: 'all', label: 'All', icon: '🏆' },
    { value: 'explorer', label: 'Explorer', icon: '🗺️' },
    { value: 'finder', label: 'Finder', icon: '🔍' },
    { value: 'supporter', label: 'Supporter', icon: '🤝' },
    { value: 'speed', label: 'Speed', icon: '⚡' },
    { value: 'community', label: 'Community', icon: '👥' }
  ];

  const handleAchievementClick = (achievement: any) => {
    setSelectedAchievement(achievement);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Achievements
              </CardTitle>
              <CardDescription>
                Unlock badges by completing activities
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {unlockedCount}/{totalCount}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-6">
              {categories.map((cat) => (
                <TabsTrigger 
                  key={cat.value} 
                  value={cat.value}
                  className="text-xs"
                >
                  <span className="mr-1">{cat.icon}</span>
                  <span className="hidden sm:inline">{cat.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((cat) => (
              <TabsContent key={cat.value} value={cat.value}>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {achievements
                    .filter(a => cat.value === 'all' || a.achievement.category === cat.value)
                    .map((userAchievement) => (
                      <AchievementCard
                        key={userAchievement.achievement.id}
                        achievement={userAchievement.achievement}
                        progress={userAchievement.progress}
                        isUnlocked={userAchievement.is_unlocked}
                        onClick={() => handleAchievementClick(userAchievement)}
                      />
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <AchievementModal
        achievement={selectedAchievement}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
};
