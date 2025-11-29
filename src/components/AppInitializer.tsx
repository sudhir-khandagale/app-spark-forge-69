import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNativeFeatures } from '@/hooks/useNativeFeatures';
import { useTheme } from '@/components/theme-provider';
import { supabase } from '@/integrations/supabase/client';

export const AppInitializer = () => {
  const { statusBar, isNative } = useNativeFeatures();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isNative) return;

    // Initialize status bar based on theme
    const initStatusBar = async () => {
      if (theme === 'dark') {
        await statusBar.setDark();
        await statusBar.setBackgroundColor('#020817'); // slate-950
      } else {
        await statusBar.setLight();
        await statusBar.setBackgroundColor('#2563eb'); // primary blue
      }
    };

    initStatusBar();
  }, [theme, statusBar, isNative]);

  // Check onboarding status
  useEffect(() => {
    const checkOnboarding = async () => {
      if (checked) return;
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setChecked(true);
          return;
        }

        // Skip check if already on onboarding page or auth page
        if (location.pathname === '/profile/onboarding' || location.pathname === '/auth') {
          setChecked(true);
          return;
        }

        // Check if user has completed onboarding
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .single();

        if (preferences && !preferences.onboarding_completed) {
          navigate('/profile/onboarding');
        }
        
        setChecked(true);
      } catch (error) {
        console.error('Error checking onboarding:', error);
        setChecked(true);
      }
    };

    checkOnboarding();
  }, [navigate, location.pathname, checked]);

  return null;
};
