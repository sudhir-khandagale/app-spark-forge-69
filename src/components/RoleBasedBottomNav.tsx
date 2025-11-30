import { useUserRole } from '@/hooks/useUserRole';
import BottomNav from '@/components/BottomNav';
import VendorBottomNav from '@/components/VendorBottomNav';

const RoleBasedBottomNav = () => {
  const { isVendor, isAdmin, loading } = useUserRole();

  // Show default customer navigation while loading
  if (loading) return <BottomNav />;

  // Admins get customer navigation
  if (isVendor && !isAdmin) {
    return <VendorBottomNav />;
  }

  return <BottomNav />;
};

export default RoleBasedBottomNav;
