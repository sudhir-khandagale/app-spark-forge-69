import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  rank: number;
  points: number;
  level: number;
  level_name: string;
}

export const useLeaderboard = (
  latitude?: number,
  longitude?: number,
  radius: number = 10,
  period: string = 'alltime',
  limit: number = 10
) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (latitude && longitude) {
      fetchLeaderboard();
    } else {
      fetchGlobalLeaderboard();
    }
  }, [latitude, longitude, radius, period, limit]);

  const fetchLeaderboard = async () => {
    try {
      if (!latitude || !longitude) return;

      const { data, error } = await supabase.rpc('get_local_leaderboard', {
        p_latitude: latitude,
        p_longitude: longitude,
        p_radius_km: radius,
        p_period: period,
        p_limit: limit
      });

      if (error) throw error;
      
      setLeaderboard(data || []);
      
      // Find current user's rank
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const userEntry = data?.find((entry: LeaderboardEntry) => entry.user_id === user.id);
        setCurrentUserRank(userEntry?.rank || null);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalLeaderboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Get top users by points
      const { data, error } = await supabase
        .from('user_points')
        .select(`
          user_id,
          balance,
          profiles!inner(display_name, avatar_url),
          user_levels(level, level_name)
        `)
        .order('balance', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const formatted = data?.map((entry: any, index: number) => ({
        user_id: entry.user_id,
        display_name: entry.profiles?.display_name || 'Anonymous',
        avatar_url: entry.profiles?.avatar_url,
        rank: index + 1,
        points: entry.balance,
        level: entry.user_levels?.level || 1,
        level_name: entry.user_levels?.level_name || 'New Explorer'
      })) || [];

      setLeaderboard(formatted);

      // Find current user's rank
      if (user) {
        const userEntry = formatted.find(entry => entry.user_id === user.id);
        setCurrentUserRank(userEntry?.rank || null);
      }
    } catch (error) {
      console.error('Error fetching global leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    leaderboard,
    currentUserRank,
    loading,
    refreshLeaderboard: latitude && longitude ? fetchLeaderboard : fetchGlobalLeaderboard
  };
};
