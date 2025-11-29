import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tier: string;
  requirement_type: string;
  requirement_count: number;
  points_reward: number;
}

interface UserAchievement {
  achievement: Achievement;
  unlocked_at: string | null;
  progress: number;
  is_unlocked: boolean;
  progress_percentage: number;
}

export const useAchievements = (category?: string) => {
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();

    // Subscribe to achievement unlocks
    const channel = supabase
      .channel('achievement-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_achievements',
        },
        () => {
          fetchAchievements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [category]);

  const fetchAchievements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch all achievements
      let query = supabase
        .from('achievements')
        .select('*')
        .order('requirement_count', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      const { data: allAchievements, error: achievementsError } = await query;
      if (achievementsError) throw achievementsError;

      // Fetch user achievements
      const { data: userAchievements, error: userError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id);

      if (userError) throw userError;

      // Merge data
      const merged = allAchievements?.map(achievement => {
        const userAchievement = userAchievements?.find(
          ua => ua.achievement_id === achievement.id
        );

        const progress = userAchievement?.progress || 0;
        const is_unlocked = progress >= achievement.requirement_count;
        const progress_percentage = Math.min(
          (progress / achievement.requirement_count) * 100,
          100
        );

        return {
          achievement,
          unlocked_at: is_unlocked ? userAchievement?.unlocked_at : null,
          progress,
          is_unlocked,
          progress_percentage
        };
      }) || [];

      setAchievements(merged);
      setUnlockedCount(merged.filter(a => a.is_unlocked).length);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    achievements,
    unlockedCount,
    totalCount: achievements.length,
    loading,
    refreshAchievements: fetchAchievements
  };
};
