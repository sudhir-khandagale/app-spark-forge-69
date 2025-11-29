import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export const OnboardingCheck = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [checked, setChecked] = useState(false);

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
