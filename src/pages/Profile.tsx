import { LogOut, User, Store as StoreIcon, Settings as SettingsIcon, Heart, List, Plus, Shield, ArrowLeft, Edit, ShoppingBag, Check, Circle, BarChart3, Crown, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import RoleBasedBottomNav from '@/components/RoleBasedBottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { useVendorSubscription } from '@/hooks/useVendorSubscription';
import SubscriptionTiersModal from '@/components/SubscriptionTiersModal';
import { useTranslation } from '@/hooks/useTranslation';

const Profile = () => {
  const { t } = useTranslation();
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
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [displayName, setDisplayName] = useState<string>('');
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { subscription, loading: subLoading } = useVendorSubscription(user?.id);

  useEffect(() => {
    if (user) {
      // Run all data fetches in parallel for faster loading
      // Using Promise.all ensures they all complete before any dependent renders
      const fetchData = async () => {
        try {
          await Promise.all([
            fetchUserProfile(),
            checkProfileCompletion(),
            (isVendor || isAdmin) ? fetchVendorStores() : Promise.resolve(),
          ]);
        } catch (error) {
          console.error('Error loading profile data:', error);
        }
      };
      fetchData();
    }
  }, [user, isVendor, isAdmin]);

  const checkProfileCompletion = async () => {
    if (!user) return;

    try {
      // Check if onboarding is completed
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .single();

      // Check if profile is incomplete
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', user.id)
        .single();

      const isIncomplete = 
        !preferences?.onboarding_completed || 
        !profile?.display_name || 
        !profile?.avatar_url;

      setShowProfileCompletion(isIncomplete);
    } catch (error) {
      console.error('Error checking profile completion:', error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url, banner_url, social_links, display_name')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      if (data) {
        setAvatarUrl(data.avatar_url);
        setBannerUrl(data.banner_url);
        setSocialLinks((data.social_links as Record<string, string>) || {});
        setDisplayName(data.display_name || user?.email || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchVendorStores = async () => {
    try {
      // Explicitly select only needed columns - exclude banking data for security
      const { data, error } = await supabase
        .from('stores')
        .select('id, name, address, phone, email, latitude, longitude, hours, description, rating, review_count, specialties, photo_urls, status, featured, offers_delivery, delivery_charges, cod_available, google_maps_link, owner_id, rejection_reason, commission_rate, created_at, updated_at')
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
              <CardTitle>{t('not_logged_in')}</CardTitle>
              <CardDescription>{t('login_to_view_profile')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/auth">
                <Button className="w-full">{t('go_to_login')}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <RoleBasedBottomNav />
      </div>
    );
  }

  // Show loading skeleton while initial data loads
  const isInitialLoading = !avatarUrl && !bannerUrl && loading;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background pb-20">
      <div className="container max-w-6xl mx-auto p-4 space-y-6">
        {/* Profile Completion Prompt */}
        {showProfileCompletion && (
          <Card className="border-2 border-primary bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/20 p-3 rounded-full">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg">{t('complete_profile')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('complete_profile_desc')}
                    </p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      {avatarUrl ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={avatarUrl ? 'line-through text-muted-foreground' : ''}>
                        Add profile photo
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.user_metadata?.display_name ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={user.user_metadata?.display_name ? 'line-through text-muted-foreground' : ''}>
                        Set display name
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Circle className="h-4 w-4 text-muted-foreground" />
                      <span>Choose interests</span>
                    </div>
                  </div>
                  <Button onClick={() => navigate('/profile/onboarding')} className="w-full sm:w-auto">
                    Continue Setup →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <ProfileHeader 
          avatarUrl={avatarUrl || undefined} 
          displayName={displayName || user?.email || 'User'}
          bannerUrl={bannerUrl || undefined}
          socialLinks={socialLinks}
        />
        
        {/* User-only features (non-vendor) */}
        {!isVendor && (
          <>
            <div className="grid md:grid-cols-2 gap-6">
              <StreakCounter />
              <RewardsDisplay />
            </div>
            
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <ShoppingStatistics />
                <AchievementGrid />
              </div>
              <div className="space-y-6">
                <LeaderboardCard />
                <ActivityFeed />
              </div>
            </div>
          </>
        )}

        {(isVendor || isAdmin) && (
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <StoreIcon className="w-6 h-6 text-primary" />
                  My Stores
                </CardTitle>
                {subscription && !subLoading && (
                  <div className="flex items-center gap-2">
                    <Badge variant={subscription.tier === 'free' ? 'secondary' : 'default'}>
                      {subscription.tier === 'free' && '⚡'}
                      {subscription.tier === 'pro' && '⭐'}
                      {subscription.tier === 'premium' && '👑'}
                      {' '}
                      {subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)}
                    </Badge>
                  </div>
                )}
              </div>
              {subscription && !subLoading && (
                <div className="text-sm text-muted-foreground">
                  {subscription.storeCount}/{subscription.storeLimits[subscription.tier]} stores used
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3">
                {stores.map((store) => (
                  <div key={store.id} className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 justify-start hover:bg-primary/5 hover:border-primary transition-all h-auto py-3" 
                      onClick={() => navigate(`/vendor/dashboard/${store.id}`)}
                    >
                      <StoreIcon className="w-5 h-5 mr-3" />
                      <div className="text-left">
                        <div className="font-semibold">{store.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{store.status}</div>
                      </div>
                    </Button>
                    <Button
                      variant="default"
                      size="icon"
                      className="shrink-0"
                      onClick={() => navigate(`/vendor/dashboard/${store.id}`)}
                    >
                      <BarChart3 className="w-5 h-5" />
                    </Button>
                  </div>
                ))}
              </div>

              {subscription && !subLoading && subscription.storeCount >= subscription.storeLimits[subscription.tier] && !subscription.isAdmin && (
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Lock className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1 space-y-2">
                        <p className="text-sm font-medium">Store Limit Reached</p>
                        <p className="text-xs text-muted-foreground">
                          Upgrade to {subscription.tier === 'free' ? 'Pro (3 stores)' : 'Premium (5 stores)'} to register more stores
                        </p>
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={() => setShowUpgradeModal(true)}
                        >
                          <Crown className="w-3 h-3 mr-1" />
                          View Plans
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <Button 
                variant="default" 
                className="w-full"
                disabled={subscription && !subLoading && subscription.storeCount >= subscription.storeLimits[subscription.tier] && !subscription.isAdmin}
                onClick={() => navigate('/onboarding/merchant')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Register New Store
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="border-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Button variant="outline" onClick={() => navigate('/profile/manage')} className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary transition-all">
                <Edit className="w-5 h-5" />
                <span className="text-sm font-medium">Edit Profile</span>
              </Button>
              {!isVendor && (
                <>
                  <Button variant="outline" onClick={() => navigate('/lists')} className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary transition-all">
                    <List className="w-5 h-5" />
                    <span className="text-sm font-medium">My Lists</span>
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/wishlist')} className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary transition-all">
                    <Heart className="w-5 h-5" />
                    <span className="text-sm font-medium">Wishlist</span>
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/friends')} className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary transition-all">
                    <User className="w-5 h-5" />
                    <span className="text-sm font-medium">Friends</span>
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={() => navigate('/orders')} className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary transition-all">
                <ShoppingBag className="w-5 h-5" />
                <span className="text-sm font-medium">Orders</span>
              </Button>
              {isAdmin && (
                <Button variant="outline" onClick={() => navigate('/admin')} className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary transition-all">
                  <Shield className="w-5 h-5" />
                  <span className="text-sm font-medium">Admin</span>
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate('/settings')} className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary transition-all">
                <SettingsIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Settings</span>
              </Button>
              <Button variant="destructive" onClick={handleSignOut} disabled={loading} className="h-auto py-4 flex-col gap-2">
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Sign Out</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {userLevel && (
        <LevelUpCelebration
          level={userLevel.level}
          levelName={userLevel.level_name}
          open={showLevelUp}
          onClose={() => setShowLevelUp(false)}
        />
      )}

      {stores.length > 0 && (
        <SubscriptionTiersModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          storeId={stores[0].id}
          currentTier={subscription?.tier || 'free'}
          onUpgrade={() => {
            setShowUpgradeModal(false);
            fetchVendorStores();
          }}
        />
      )}
      
      <RoleBasedBottomNav />
    </div>
  );
};

export default Profile;
