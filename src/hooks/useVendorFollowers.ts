import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useVendorFollowers = (storeId?: string) => {
  const [followers, setFollowers] = useState<any[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (storeId) {
      fetchFollowers();
      checkIfFollowing();
    }
  }, [storeId]);

  const fetchFollowers = async () => {
    try {
      const { count } = await supabase
        .from('vendor_followers')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', storeId);

      setFollowersCount(count || 0);
    } catch (error) {
      console.error('Error fetching followers:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfFollowing = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('vendor_followers')
        .select('id')
        .eq('follower_id', user.id)
        .eq('store_id', storeId)
        .maybeSingle();

      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const toggleFollow = async (vendorId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Login required",
          description: "Please login to follow vendors",
          variant: "destructive",
        });
        return;
      }

      if (isFollowing) {
        await supabase
          .from('vendor_followers')
          .delete()
          .match({ follower_id: user.id, vendor_id: vendorId });
        
        toast({ title: "Unfollowed successfully" });
      } else {
        await supabase
          .from('vendor_followers')
          .insert({
            follower_id: user.id,
            vendor_id: vendorId,
            store_id: storeId!,
          });
        
        toast({ title: "Following!" });
      }

      setIsFollowing(!isFollowing);
      fetchFollowers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return {
    followers,
    followersCount,
    isFollowing,
    loading,
    toggleFollow,
    refresh: fetchFollowers,
  };
};
