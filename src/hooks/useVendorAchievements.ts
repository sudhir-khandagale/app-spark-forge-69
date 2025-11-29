import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  badge_color: string;
  requirement_type: string;
  requirement_value: number;
  points_reward: number;
}

interface UserAchievement {
  achievement: Achievement;
  unlocked_at: string | null;
  progress: number;
}

export const useVendorAchievements = (vendorId?: string) => {
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (vendorId) {
      fetchAchievements();
    }
  }, [vendorId]);

  const fetchAchievements = async () => {
    try {
      const { data: allAchievements } = await supabase
        .from('vendor_achievements')
        .select('*')
        .order('requirement_value', { ascending: true });

      const { data: userAchievements } = await supabase
        .from('user_vendor_achievements')
        .select('*')
        .eq('vendor_id', vendorId);

      if (allAchievements) {
        const combined = allAchievements.map(achievement => {
          const userAchievement = userAchievements?.find(
            ua => ua.achievement_id === achievement.id
          );
          return {
            achievement,
            unlocked_at: userAchievement?.unlocked_at || null,
            progress: userAchievement?.progress || 0,
          };
        });
        setAchievements(combined);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    achievements,
    loading,
    refreshAchievements: fetchAchievements,
  };
};
