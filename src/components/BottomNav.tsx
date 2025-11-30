import { Home, Map, ClipboardList, ShoppingCart, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useNativeFeatures } from '@/hooks/useNativeFeatures';
import { useCartCount } from '@/hooks/useCartCount';
import { useTranslation } from '@/hooks/useTranslation';

const BottomNav = () => {
  const location = useLocation();
  const { haptic } = useNativeFeatures();
  const cartCount = useCartCount();
  const { t } = useTranslation();

  const navItems = [
    { icon: Home, label: t('nav_home'), path: '/' },
    { icon: Map, label: t('nav_map'), path: '/map' },
    { icon: ClipboardList, label: t('nav_lists'), path: '/lists' },
    { icon: ShoppingCart, label: t('nav_cart'), path: '/cart' },
    { icon: User, label: t('nav_profile'), path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map(({ icon: Icon, label, path }) => {
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
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{label}</span>
              {/* Cart Badge */}
              {label === t('nav_cart') && cartCount > 0 && (
                <span className="absolute top-2 right-1/4 translate-x-1/2 bg-destructive text-destructive-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
