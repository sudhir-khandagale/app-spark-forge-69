import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserPoints {
  balance: number;
  lifetime_points: number;
}

interface PointsTransaction {
  id: string;
  points: number;
  action_type: string;
  description: string | null;
  created_at: string;
}

export const useRewards = () => {
  const [points, setPoints] = useState<UserPoints | null>(null);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRewards();
    
    // Set up realtime subscription for points updates
    const channel = supabase
      .channel('user-points-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_points'
        },
        () => {
          fetchRewards();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRewards = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch points balance
      const { data: pointsData } = await supabase
        .from('user_points')
        .select('balance, lifetime_points')
        .eq('user_id', user.id)
        .single();

      setPoints(pointsData || { balance: 0, lifetime_points: 0 });

      // Fetch recent transactions
      const { data: transactionsData } = await supabase
        .from('points_transactions')
        .select('id, points, action_type, description, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setTransactions(transactionsData || []);
    } catch (error) {
      console.error('Error fetching rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    points,
    transactions,
    loading,
    refreshRewards: fetchRewards
  };
};
