import { Home, Share2, User, LayoutDashboard, Package } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useNativeFeatures } from '@/hooks/useNativeFeatures';
import { useVendorNotifications } from '@/hooks/useVendorNotifications';
import { useStores } from '@/hooks/useStores';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

const VendorBottomNav = () => {
  const location = useLocation();
  const { haptic } = useNativeFeatures();
  const { t } = useTranslation();
  const [storeId, setStoreId] = useState<string | null>(null);

  useEffect(() => {
    const fetchStoreId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .eq('status', 'approved')
        .single();

      if (store) {
        setStoreId(store.id);
      }
    };

    fetchStoreId();
  }, []);

  const { unreadCount } = useVendorNotifications(storeId);

  const navItems = [
    { icon: Home, label: t('nav_home'), path: '/' },
    { icon: storeId ? Package : LayoutDashboard, label: storeId ? 'Inventory' : t('nav_dashboard'), path: storeId ? `/inventory/${storeId}` : '/vendor/dashboard' },
    { icon: LayoutDashboard, label: t('nav_dashboard'), path: '/vendor/dashboard' },
    { icon: Share2, label: t('nav_feed'), path: '/vendor-feed' },
    { icon: User, label: t('nav_profile'), path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={label}
              to={path}
              onClick={() => haptic.light()}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-all duration-200 relative",
                isActive
                  ? "text-accent scale-110"
                  : "text-muted-foreground hover:text-foreground hover:scale-105"
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{label}</span>
              {/* Dashboard Notifications Badge */}
              {label === t('nav_dashboard') && unreadCount > 0 && (
                <span className="absolute top-2 right-1/4 translate-x-1/2 bg-destructive text-destructive-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default VendorBottomNav;
