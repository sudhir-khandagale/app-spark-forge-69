import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserLevel {
  level: number;
  level_name: string;
  current_points: number;
  next_level_points: number;
  progress_percentage: number;
}

export const useUserLevel = () => {
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserLevel();

    // Subscribe to level changes
    const channel = supabase
      .channel('user-level-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_levels',
        },
        () => {
          fetchUserLevel();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUserLevel = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_levels')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const progress = ((data.current_points / data.next_level_points) * 100);
        setUserLevel({
          ...data,
          progress_percentage: Math.min(progress, 100)
        });
      } else {
        // Initialize default level if none exists
        const { data: newLevel, error: insertError } = await supabase
          .from('user_levels')
          .insert({
            user_id: user.id,
            level: 1,
            level_name: 'New Explorer',
            current_points: 0,
            next_level_points: 51
          })
          .select()
          .single();

        if (!insertError && newLevel) {
          setUserLevel({
            ...newLevel,
            progress_percentage: 0
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user level:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    userLevel,
    loading,
    refreshLevel: fetchUserLevel
  };
};
