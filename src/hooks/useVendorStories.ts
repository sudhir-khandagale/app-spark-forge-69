import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VendorStory {
  id: string;
  vendor_id: string;
  store_id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  story_type: string | null;
  views_count: number;
  created_at: string;
  expires_at: string;
  metadata: any;
}

export const useVendorStories = (storeId?: string) => {
  const [stories, setStories] = useState<VendorStory[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (storeId) {
      fetchStories();
    }
  }, [storeId]);

  const fetchStories = async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('vendor_stories')
        .select('*')
        .eq('store_id', storeId)
        .gt('expires_at', now)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStories(data || []);
    } catch (error: any) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const createStory = async (storyData: {
    store_id: string;
    media_url: string;
    media_type: string;
    caption?: string;
    story_type?: string;
    metadata?: any;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Authentication required',
          description: 'Please login to create stories',
          variant: 'destructive',
        });
        return null;
      }

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { data, error } = await supabase
        .from('vendor_stories')
        .insert({
          vendor_id: user.id,
          store_id: storyData.store_id,
          media_url: storyData.media_url,
          media_type: storyData.media_type,
          caption: storyData.caption || null,
          story_type: storyData.story_type || 'regular',
          expires_at: expiresAt.toISOString(),
          metadata: storyData.metadata || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Story posted!',
        description: 'Your story is now live for 24 hours',
      });

      fetchStories();
      return data;
    } catch (error: any) {
      console.error('Error creating story:', error);
      toast({
        title: 'Error',
        description: 'Failed to post story',
        variant: 'destructive',
      });
      return null;
    }
  };

  const incrementViews = async (storyId: string) => {
    try {
      const { data: story } = await supabase
        .from('vendor_stories')
        .select('views_count')
        .eq('id', storyId)
        .single();

      if (story) {
        const { error } = await supabase
          .from('vendor_stories')
          .update({ views_count: story.views_count + 1 })
          .eq('id', storyId);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  };

  return {
    stories,
    loading,
    createStory,
    incrementViews,
    refreshStories: fetchStories,
  };
};
