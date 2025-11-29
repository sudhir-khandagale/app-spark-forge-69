import { Home, Package, Share2, LayoutDashboard, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useNativeFeatures } from '@/hooks/useNativeFeatures';
import { Badge } from '@/components/ui/badge';
import { useVendorNotifications } from '@/hooks/useVendorNotifications';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const VendorBottomNav = () => {
  const location = useLocation();
  const { haptic } = useNativeFeatures();
  const [storeId, setStoreId] = useState<string | null>(null);
  const { notifications } = useVendorNotifications(storeId || undefined);
  const lowStockCount = notifications?.filter(n => !n.read && (n.type === 'low_stock' || n.type === 'out_of_stock')).length || 0;

  useEffect(() => {
    const fetchStore = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .single();
      
      if (data) setStoreId(data.id);
    };
    fetchStore();
  }, []);

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Package, label: 'Inventory', path: storeId ? `/inventory/${storeId}` : '/', badge: lowStockCount },
    { icon: Share2, label: 'Social', path: '/vendor-feed' },
    { icon: LayoutDashboard, label: 'Dashboard', path: storeId ? `/dashboard/store/${storeId}` : '/profile' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map(({ icon: Icon, label, path, badge }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              onClick={() => haptic.light()}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-all duration-200 relative",
                isActive
                  ? "text-accent scale-110"
                  : "text-muted-foreground hover:text-foreground hover:scale-105"
              )}
            >
              <div className="relative">
                <Icon className="w-6 h-6" />
                {badge && badge > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {badge}
                  </Badge>
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
