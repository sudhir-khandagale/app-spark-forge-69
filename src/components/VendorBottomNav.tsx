import { Home, Package, Share2, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useNativeFeatures } from '@/hooks/useNativeFeatures';
import { Badge } from '@/components/ui/badge';
import { useVendorNotifications } from '@/hooks/useVendorNotifications';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

const VendorBottomNav = () => {
  const location = useLocation();
  const { haptic } = useNativeFeatures();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [loadingStore, setLoadingStore] = useState(true);
  const { notifications } = useVendorNotifications(storeId || undefined);
  const lowStockCount = notifications?.filter(n => !n.read && (n.type === 'low_stock' || n.type === 'out_of_stock')).length || 0;

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data } = await supabase
          .from('stores')
          .select('id')
          .eq('owner_id', user.id)
          .single();
        
        if (data) setStoreId(data.id);
      } finally {
        setLoadingStore(false);
      }
    };
    fetchStore();
  }, []);

  const getInventoryPath = () => {
    if (loadingStore) return '#';
    if (!storeId) return '/onboarding/merchant';
    return `/inventory/${storeId}`;
  };

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Package, label: 'Inventory', path: getInventoryPath(), badge: lowStockCount, disabled: loadingStore },
    { icon: Share2, label: 'Feed', path: '/vendor-feed' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map(({ icon: Icon, label, path, badge, disabled }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={label}
              to={disabled ? '#' : path}
              onClick={(e) => {
                if (disabled) {
                  e.preventDefault();
                  return;
                }
                haptic.light();
              }}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-all duration-200 relative",
                disabled && "opacity-50 cursor-not-allowed",
                !disabled && isActive && "text-accent scale-110",
                !disabled && !isActive && "text-muted-foreground hover:text-foreground hover:scale-105"
              )}
            >
              <div className="relative">
                {disabled ? (
                  <Skeleton className="w-6 h-6 rounded" />
                ) : (
                  <>
                    <Icon className="w-6 h-6" />
                    {badge && badge > 0 && (
                      <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {badge}
                      </Badge>
                    )}
                  </>
                )}
              </div>
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default VendorBottomNav;
