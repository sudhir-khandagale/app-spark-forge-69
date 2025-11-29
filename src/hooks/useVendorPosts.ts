import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VendorPost {
  id: string;
  vendor_id: string;
  store_id: string;
  content: string;
  media_urls: string[];
  post_type: 'product_showcase' | 'behind_scenes' | 'success_story' | 'announcement';
  likes_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
  store?: {
    name: string;
    photo_urls: string[];
  };
  profile?: {
    display_name: string;
    avatar_url: string;
  };
}

export const useVendorPosts = (storeId?: string) => {
  const [posts, setPosts] = useState<VendorPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel('vendor-posts')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'vendor_posts',
      }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId]);

  const fetchPosts = async () => {
    try {
      let query = supabase
        .from('vendor_posts')
        .select('*, store:stores(name, photo_urls)')
        .order('created_at', { ascending: false });

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data: postsData, error } = await query;
      if (error) throw error;

      // Fetch profiles separately
      const vendorIds = postsData?.map(p => p.vendor_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', vendorIds);

      const postsWithProfiles = postsData?.map(post => ({
        ...post,
        profile: profiles?.find(p => p.id === post.vendor_id) || null,
      })) || [];

      setPosts(postsWithProfiles as VendorPost[]);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (postData: {
    store_id: string;
    content: string;
    media_urls?: string[];
    post_type: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('vendor_posts')
        .insert({
          vendor_id: user.id,
          ...postData,
        });

      if (error) throw error;

      toast({
        title: "Post created!",
        description: "Your post has been shared successfully.",
      });

      fetchPosts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const likePost = async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('post_likes')
        .insert({ user_id: user.id, post_id: postId });

      if (error) {
        // If already liked, unlike
        await supabase
          .from('post_likes')
          .delete()
          .match({ user_id: user.id, post_id: postId });
      }

      fetchPosts();
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  return {
    posts,
    loading,
    createPost,
    likePost,
    refreshPosts: fetchPosts,
  };
};
