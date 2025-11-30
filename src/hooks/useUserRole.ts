import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

type UserRole = 'customer' | 'vendor' | 'admin' | null;

export const useUserRole = () => {
  // Initialize from localStorage cache to prevent flickering
  const [role, setRole] = useState<UserRole>(() => {
    const cached = localStorage.getItem('userRole');
    return (cached as UserRole) || null;
  });
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async (userId: string) => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      const userRole = data?.role as UserRole || null;
      setRole(userRole);
      
      // Cache the role in localStorage
      if (userRole) {
        localStorage.setItem('userRole', userRole);
      } else {
        localStorage.removeItem('userRole');
      }
      
      setLoading(false);
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchUserRole(session.user.id);
        } else {
          setUser(null);
          setRole(null);
          setLoading(false);
          // Clear cache on logout
          localStorage.removeItem('userRole');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        await fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    role,
    user,
    loading,
    isCustomer: role === 'customer',
    isVendor: role === 'vendor',
    isAdmin: role === 'admin',
  };
};
