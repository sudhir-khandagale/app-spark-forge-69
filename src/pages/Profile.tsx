import { LogOut, User, Store as StoreIcon, Settings as SettingsIcon, Heart, List, Plus, Shield, ArrowLeft, Edit } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUserRole } from '@/hooks/useUserRole';
import { useState, useEffect } from 'react';
import RewardsDisplay from '@/components/RewardsDisplay';
import { AvatarImage } from '@/components/ui/avatar';
import flowduxIcon from '@/assets/flowdux-icon.png';

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, role, isVendor, isAdmin } = useUserRole();
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      if (isVendor || isAdmin) {
        fetchVendorStores();
      }
    }
  }, [user, isVendor, isAdmin]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setAvatarUrl(data?.avatar_url || null);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchVendorStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user?.id);

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: 'Signed Out',
        description: 'You have been successfully signed out.'
      });
      navigate('/auth');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to sign out',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen pb-16">
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Not Logged In</CardTitle>
              <CardDescription>Please login to view your profile</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/auth">
                <Button className="w-full">Go to Login</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-16">
      <header className="bg-gradient-primary text-white p-6 border-b border-border/20">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/')}
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <img src={flowduxIcon} alt="Flowdux" className="h-8 w-8 rounded-lg shadow-md" />
              <h1 className="text-2xl font-bold">Profile</h1>
            </div>
            <Link to="/settings">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <SettingsIcon className="w-5 h-5" />
              </Button>
            </Link>
          </div>
          
          {/* User Info in Header */}
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <Avatar className="w-16 h-16 border-2 border-white/30">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="text-xl bg-white/20">
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white">{user.email}</h2>
              <p className="text-white/80 text-sm capitalize">{role === 'customer' ? 'User' : role} Account</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4">
        <div className="max-w-lg mx-auto space-y-4">
          {/* Rewards Section */}
          <RewardsDisplay />

          {(isVendor || isAdmin) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StoreIcon className="w-5 h-5" />
                  My Stores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stores.length === 0 ? (
                  <Link to="/onboarding/merchant" className="w-full">
                    <Button variant="outline" className="w-full justify-start">
                      <Plus className="w-4 h-4 mr-2" />
                      Register Your Store
                    </Button>
                  </Link>
                ) : (
                  <>
                    {stores.map((store) => (
                      <Link key={store.id} to={`/dashboard/store/${store.id}`} className="w-full">
                        <Button variant="outline" className="w-full justify-start">
                          <StoreIcon className="w-4 h-4 mr-2" />
                          {store.name}
                        </Button>
                      </Link>
                    ))}
                    <Link to="/onboarding/merchant" className="w-full">
                      <Button variant="outline" className="w-full justify-start">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Another Store
                      </Button>
                    </Link>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6 space-y-2">
              <Link to="/profile/manage" className="w-full">
                <Button variant="outline" className="w-full justify-start">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </Link>

              <Link to="/lists" className="w-full">
                <Button variant="outline" className="w-full justify-start">
                  <List className="w-4 h-4 mr-2" />
                  My Shopping Lists
                </Button>
              </Link>

              <Link to="/wishlist" className="w-full">
                <Button variant="outline" className="w-full justify-start">
                  <Heart className="w-4 h-4 mr-2" />
                  My Wishlist
                </Button>
              </Link>

              {isAdmin && (
                <Link to="/admin" className="w-full">
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="w-4 h-4 mr-2" />
                    Admin Dashboard
                  </Button>
                </Link>
              )}

              <Link to="/settings" className="w-full">
                <Button variant="outline" className="w-full justify-start">
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </Link>

              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={handleSignOut}
                disabled={loading}
              >
                <LogOut className="w-4 h-4 mr-2" />
                {loading ? 'Signing Out...' : 'Sign Out'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
