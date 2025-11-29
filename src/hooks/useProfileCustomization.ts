import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ProfilePreferences {
  shopping_interests: string[];
  preferred_shop_types: string[];
  profile_visibility: 'public' | 'private' | 'friends';
  activity_sharing: boolean;
  showcase_achievements: string[];
  theme_preference: 'light' | 'dark' | 'auto';
}

export const useProfileCustomization = () => {
  const [preferences, setPreferences] = useState<ProfilePreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      // If no preferences exist, create default ones
      if (!data) {
        const defaultPreferences: ProfilePreferences = {
          shopping_interests: [],
          preferred_shop_types: [],
          profile_visibility: 'public',
          activity_sharing: true,
          showcase_achievements: [],
          theme_preference: 'auto',
        };
        
        const { error: insertError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            ...defaultPreferences
          });
        
        if (insertError) throw insertError;
        setPreferences(defaultPreferences);
      } else {
        setPreferences(data as ProfilePreferences);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<ProfilePreferences>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...updates
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Preferences updated",
        description: "Your profile preferences have been saved."
      });

      await fetchPreferences();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return {
    preferences,
    loading,
    updatePreferences,
    refreshPreferences: fetchPreferences
  };
};
