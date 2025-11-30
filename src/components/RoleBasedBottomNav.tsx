import { useUserRole } from '@/hooks/useUserRole';
import BottomNav from '@/components/BottomNav';
import VendorBottomNav from '@/components/VendorBottomNav';
import { Skeleton } from '@/components/ui/skeleton';

const RoleBasedBottomNav = () => {
  const { isVendor, isAdmin, loading } = useUserRole();

  // Optimized: Show default nav immediately for better UX, update when role loads
  // This prevents blocking the entire bottom nav while auth is being checked
  if (isVendor && !isAdmin) {
    return <VendorBottomNav />;
  }

  // Show customer nav by default (covers unauthenticated + customer cases)
  // The loading skeleton was causing poor perceived performance
  return <BottomNav />;
};

export default RoleBasedBottomNav;
