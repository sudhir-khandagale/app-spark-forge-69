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

      // Get top users by points with their profiles
      const { data: pointsData, error: pointsError } = await supabase
        .from('user_points')
        .select('user_id, balance')
        .order('balance', { ascending: false })
        .limit(limit);

      if (pointsError) throw pointsError;

      if (!pointsData || pointsData.length === 0) {
        setLeaderboard([]);
        setLoading(false);
        return;
      }

      // Fetch profiles and levels separately
      const userIds = pointsData.map(p => p.user_id);
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      const { data: levels } = await supabase
        .from('user_levels')
        .select('user_id, level, level_name')
        .in('user_id', userIds);

      const formatted = pointsData.map((entry: any, index: number) => {
        const profile = profiles?.find(p => p.id === entry.user_id);
        const level = levels?.find(l => l.user_id === entry.user_id);

        return {
          user_id: entry.user_id,
          display_name: profile?.display_name || 'Anonymous',
          avatar_url: profile?.avatar_url,
          rank: index + 1,
          points: entry.balance,
          level: level?.level || 1,
          level_name: level?.level_name || 'New Explorer'
        };
      });

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
