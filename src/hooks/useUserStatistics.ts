import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserStatistics {
  shops_discovered: number;
  products_found: number;
  searches_made: number;
  successful_finds: number;
  reviews_written: number;
  time_saved_minutes: number;
  money_saved_estimate: number;
  current_streak: number;
  longest_streak: number;
  last_active_date: string;
  join_date: string;
  success_rate: number;
}

export const useUserStatistics = () => {
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();

    // Subscribe to statistics changes
    const channel = supabase
      .channel('statistics-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_statistics',
        },
        () => {
          fetchStatistics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStatistics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_statistics')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        const success_rate = data.searches_made > 0
          ? Math.round((data.successful_finds / data.searches_made) * 100)
          : 0;

        setStatistics({
          ...data,
          success_rate
        });
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    statistics,
    loading,
    refreshStatistics: fetchStatistics
  };
};
