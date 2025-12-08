import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

type UserRole = 'customer' | 'vendor' | 'admin' | null;

export const useUserRole = () => {
  // NOTE: This localStorage cache is ONLY for UI rendering to prevent flickering.
  // All authorization decisions are enforced server-side via RLS policies using has_role().
  // Never use this cached role for access control - it can be manipulated by users.
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
      
      // Cache the role in localStorage for UI rendering only (not for authorization)
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
