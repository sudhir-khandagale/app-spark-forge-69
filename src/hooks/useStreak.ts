import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StreakInfo {
  current_streak: number;
  longest_streak: number;
  last_active_date: string;
  is_active_today: boolean;
}

export const useStreak = () => {
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStreak();

    // Subscribe to statistics changes
    const channel = supabase
      .channel('streak-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_statistics',
        },
        () => {
          fetchStreak();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStreak = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_statistics')
        .select('current_streak, longest_streak, last_active_date')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        const today = new Date().toISOString().split('T')[0];
        const is_active_today = data.last_active_date === today;

        setStreakInfo({
          ...data,
          is_active_today
        });
      }
    } catch (error) {
      console.error('Error fetching streak:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    streakInfo,
    loading,
    refreshStreak: fetchStreak
  };
};
