import { Home, Share2, User, LayoutDashboard } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useNativeFeatures } from '@/hooks/useNativeFeatures';

const VendorBottomNav = () => {
  const location = useLocation();
  const { haptic } = useNativeFeatures();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: LayoutDashboard, label: 'Dashboard', path: '/vendor/dashboard' },
    { icon: Share2, label: 'Feed', path: '/vendor-feed' },
    { icon: User, label: 'Profile', path: '/profile' },
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
                "flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-all duration-200",
                isActive
                  ? "text-accent scale-110"
                  : "text-muted-foreground hover:text-foreground hover:scale-105"
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

export default VendorBottomNav;
