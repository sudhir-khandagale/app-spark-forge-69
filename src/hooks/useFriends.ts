import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Friend {
  id: string;
  friend_id: string;
  display_name: string;
  avatar_url: string | null;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

export const useFriends = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriends();

    // Subscribe to friend changes
    const channel = supabase
      .channel('friends-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_friends',
        },
        () => {
          fetchFriends();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchFriends = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch friends where current user is the requester
      const { data: sentRequests, error: sentError } = await supabase
        .from('user_friends')
        .select(`
          id,
          friend_id,
          status,
          created_at,
          profiles!user_friends_friend_id_fkey(display_name, avatar_url)
        `)
        .eq('user_id', user.id);

      if (sentError) throw sentError;

      // Fetch friends where current user is the receiver
      const { data: receivedRequests, error: receivedError } = await supabase
        .from('user_friends')
        .select(`
          id,
          user_id,
          status,
          created_at,
          profiles!user_friends_user_id_fkey(display_name, avatar_url)
        `)
        .eq('friend_id', user.id);

      if (receivedError) throw receivedError;

      // Combine and format
      const allFriends = [
        ...(sentRequests?.map((r: any) => ({
          id: r.id,
          friend_id: r.friend_id,
          display_name: r.profiles?.display_name || 'Anonymous',
          avatar_url: r.profiles?.avatar_url,
          status: r.status,
          created_at: r.created_at
        })) || []),
        ...(receivedRequests?.map((r: any) => ({
          id: r.id,
          friend_id: r.user_id,
          display_name: r.profiles?.display_name || 'Anonymous',
          avatar_url: r.profiles?.avatar_url,
          status: r.status,
          created_at: r.created_at
        })) || [])
      ];

      setFriends(allFriends.filter(f => f.status === 'accepted'));
      setPendingRequests(allFriends.filter(f => f.status === 'pending'));
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_friends')
        .insert({
          user_id: user.id,
          friend_id: friendId,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Friend request sent",
        description: "Your request has been sent successfully."
      });

      await fetchFriends();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('user_friends')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Friend request accepted",
        description: "You are now friends!"
      });

      await fetchFriends();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const removeFriend = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('user_friends')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;

      toast({
        title: "Friend removed",
        description: "Friendship has been removed."
      });

      await fetchFriends();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return {
    friends,
    pendingRequests,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    removeFriend,
    refreshFriends: fetchFriends
  };
};
