import { LogOut, User, Store as StoreIcon, Settings as SettingsIcon, Heart, List, Plus, Shield, ArrowLeft, Edit } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserRole } from '@/hooks/useUserRole';
import { useState, useEffect, useCallback } from 'react';
import RewardsDisplay from '@/components/RewardsDisplay';
import flowduxIcon from '@/assets/flowdux-icon.png';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { AchievementGrid } from '@/components/profile/AchievementGrid';
import { ShoppingStatistics } from '@/components/profile/ShoppingStatistics';
import { ActivityFeed } from '@/components/profile/ActivityFeed';
import { LeaderboardCard } from '@/components/profile/LeaderboardCard';
import { StreakCounter } from '@/components/profile/StreakCounter';
import { LevelUpCelebration } from '@/components/profile/LevelUpCelebration';
import { useUserLevel } from '@/hooks/useUserLevel';

const Profile = () => {
  const { userLevel } = useUserLevel();
  const [previousLevel, setPreviousLevel] = useState<number | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);

  useEffect(() => {
    if (userLevel && previousLevel !== null && userLevel.level > previousLevel) {
      setShowLevelUp(true);
    }
    if (userLevel) {
      setPreviousLevel(userLevel.level);
    }
  }, [userLevel]);
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
      if (data) {
        setAvatarUrl(data.avatar_url);
      }
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
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });

      navigate('/auth');
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
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
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-6xl mx-auto p-4 space-y-6">
        <ProfileHeader avatarUrl={avatarUrl || undefined} displayName={user?.email} />
        <StreakCounter />
        <RewardsDisplay />
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <ShoppingStatistics />
            <LeaderboardCard />
          </div>
          <ActivityFeed />
        </div>
        
        <AchievementGrid />

        {(isVendor || isAdmin) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StoreIcon className="w-5 h-5" />
                My Stores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stores.map((store) => (
                <Button key={store.id} variant="outline" className="w-full justify-start" onClick={() => navigate(`/dashboard/store/${store.id}`)}>
                  <StoreIcon className="w-4 h-4 mr-2" />
                  {store.name}
                </Button>
              ))}
              <Button variant="outline" className="w-full" onClick={() => navigate('/onboarding/merchant')}>
                <Plus className="w-4 h-4 mr-2" />
                Register New Store
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => navigate('/profile-management')}><Edit className="w-4 h-4 mr-2" />Edit Profile</Button>
          <Button variant="outline" onClick={() => navigate('/lists')}><List className="w-4 h-4 mr-2" />My Lists</Button>
          <Button variant="outline" onClick={() => navigate('/wishlist')}><Heart className="w-4 h-4 mr-2" />Wishlist</Button>
          <Button variant="outline" onClick={() => navigate('/friends')}><User className="w-4 h-4 mr-2" />Friends</Button>
          {isAdmin && <Button variant="outline" onClick={() => navigate('/admin')}><Shield className="w-4 h-4 mr-2" />Admin</Button>}
          <Button variant="outline" onClick={() => navigate('/settings')}><SettingsIcon className="w-4 h-4 mr-2" />Settings</Button>
          <Button variant="destructive" onClick={handleSignOut} disabled={loading}><LogOut className="w-4 h-4 mr-2" />Sign Out</Button>
        </div>
      </div>
      
      {userLevel && (
        <LevelUpCelebration
          level={userLevel.level}
          levelName={userLevel.level_name}
          open={showLevelUp}
          onClose={() => setShowLevelUp(false)}
        />
      )}
      
      <BottomNav />
    </div>
  );
};

export default Profile;
