import { Home, Map, ClipboardList, ShoppingCart, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useNativeFeatures } from '@/hooks/useNativeFeatures';

const BottomNav = () => {
  const location = useLocation();
  const { haptic } = useNativeFeatures();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: ClipboardList, label: 'Lists', path: '/lists' },
    { icon: ShoppingCart, label: 'Cart', path: '/cart' },
    { icon: User, label: 'Profile', path: '/profile' },
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
                "flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
