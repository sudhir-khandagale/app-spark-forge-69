import { useUserRole } from '@/hooks/useUserRole';
import BottomNav from '@/components/BottomNav';
import VendorBottomNav from '@/components/VendorBottomNav';
import { Skeleton } from '@/components/ui/skeleton';

const RoleBasedBottomNav = () => {
  const { isVendor, isAdmin, loading } = useUserRole();

  // Show skeleton loader while loading to prevent flickering
  if (loading) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center justify-center flex-1 h-full space-y-1">
              <Skeleton className="w-6 h-6 rounded" />
              <Skeleton className="w-12 h-3 rounded" />
            </div>
          ))}
        </div>
      </nav>
    );
  }

  // Admins get user navigation (non-vendor)
  if (isVendor && !isAdmin) {
    return <VendorBottomNav />;
  }

  return <BottomNav />;
};

export default RoleBasedBottomNav;
