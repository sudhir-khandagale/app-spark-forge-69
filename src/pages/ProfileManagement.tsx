import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, User, Mail, Lock, Camera } from 'lucide-react';
import { z } from 'zod';
import BottomNav from '@/components/BottomNav';
import { AvatarUpload } from '@/components/AvatarUpload';
import { BannerUpload } from '@/components/BannerUpload';
import { ProfileCompletion } from '@/components/ProfileCompletion';
import { SocialLinksEditor } from '@/components/SocialLinksEditor';
import { ProfileCustomization } from '@/components/profile/ProfileCustomization';

const displayNameSchema = z.string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must be less than 50 characters");

const emailSchema = z.string()
  .trim()
  .email("Invalid email address")
  .max(255, "Email must be less than 255 characters");

const passwordSchema = z.string()
  .min(6, "Password must be at least 6 characters")
  .max(72, "Password must be less than 72 characters");

const ProfileManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [searchRadius, setSearchRadius] = useState(10);
  const [preferences, setPreferences] = useState<any>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      setUserId(user.id);
      setEmail(user.email || '');

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, banner_url, phone, search_radius, social_links, email')
        .eq('id', user.id)
        .single();

      if (profile?.display_name) {
        setDisplayName(profile.display_name);
      }
      if (profile?.avatar_url) {
        setAvatarUrl(profile.avatar_url);
      }
      if (profile?.banner_url) {
        setBannerUrl(profile.banner_url);
      }
      if (profile?.phone) {
        setPhone(profile.phone);
      }
      if (profile?.search_radius) {
        setSearchRadius(profile.search_radius);
      }
      if (profile?.social_links) {
        setSocialLinks(profile.social_links as Record<string, string>);
      }

      // Load preferences
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('shopping_interests')
        .eq('user_id', user.id)
        .maybeSingle();

      if (prefs) {
        setPreferences(prefs);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleUpdateDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      displayNameSchema.parse(displayName);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive"
        });
        return;
      }
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Display name updated successfully"
      });
      
      // Reload data to reflect changes
      await loadUserData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update display name",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(email);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive"
        });
        return;
      }
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ 
        email: email 
      });

      if (error) throw error;

      toast({
        title: "Verification Email Sent",
        description: "Please check your new email address to confirm the change"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update email",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation do not match",
        variant: "destructive"
      });
      return;
    }

    try {
      passwordSchema.parse(newPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive"
        });
        return;
      }
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password updated successfully"
      });
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Reload data
      await loadUserData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-16 bg-gradient-to-b from-background via-background/95 to-background">
      <header className="p-4 border-b border-border/50 backdrop-blur-sm sticky top-0 z-10 bg-background/80">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/profile')} className="hover:bg-primary/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Profile Settings
            </h1>
            <p className="text-sm text-muted-foreground">Customize your profile and preferences</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Profile Completion */}
          {userId && preferences && (
            <ProfileCompletion 
              profile={{
                display_name: displayName,
                avatar_url: avatarUrl,
                banner_url: bannerUrl,
                phone: phone,
                email: email,
                social_links: socialLinks
              }}
              preferences={preferences}
            />
          )}

          <Separator />

          {/* Profile Picture */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Profile Picture
              </CardTitle>
              <CardDescription>
                Upload a profile picture (max 5MB)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userId && (
                <AvatarUpload
                  currentAvatarUrl={avatarUrl}
                  userId={userId}
                  onUploadComplete={(url) => setAvatarUrl(url)}
                />
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Profile Banner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Profile Banner
              </CardTitle>
              <CardDescription>
                Upload a banner image for your profile (max 10MB)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userId && (
                <BannerUpload
                  currentBannerUrl={bannerUrl}
                  userId={userId}
                  onUploadComplete={(url) => setBannerUrl(url)}
                />
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Display Name */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Display Name
              </CardTitle>
              <CardDescription>
                Update your display name
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateDisplayName} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="display-name">Display Name</Label>
                  <Input
                    id="display-name"
                    type="text"
                    placeholder="Enter your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Name'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Separator />

          {/* Email */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Address
              </CardTitle>
              <CardDescription>
                Update your email address. You'll need to verify the new email.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateEmail} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Email'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Separator />

          {/* Phone Number */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Phone Number
              </CardTitle>
              <CardDescription>
                Update your contact number
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                try {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (!user) throw new Error('Not authenticated');
                  
                  const { error } = await supabase
                    .from('profiles')
                    .update({ phone })
                    .eq('id', user.id);
                  
                  if (error) throw error;
                  
                  toast({
                    title: "Success",
                    description: "Phone number updated successfully"
                  });
                  await loadUserData();
                } catch (error: any) {
                  toast({
                    title: "Error",
                    description: error.message || "Failed to update phone number",
                    variant: "destructive"
                  });
                } finally {
                  setLoading(false);
                }
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Phone'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Separator />

          {/* Search Radius */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Search Radius
              </CardTitle>
              <CardDescription>
                Set your default search radius for finding stores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                try {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (!user) throw new Error('Not authenticated');
                  
                  const { error } = await supabase
                    .from('profiles')
                    .update({ search_radius: searchRadius })
                    .eq('id', user.id);
                  
                  if (error) throw error;
                  
                  toast({
                    title: "Success",
                    description: "Search radius updated successfully"
                  });
                  await loadUserData();
                } catch (error: any) {
                  toast({
                    title: "Error",
                    description: error.message || "Failed to update search radius",
                    variant: "destructive"
                  });
                } finally {
                  setLoading(false);
                }
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="search-radius">Search Radius: {searchRadius} km</Label>
                  <input
                    id="search-radius"
                    type="range"
                    min="1"
                    max="50"
                    value={searchRadius}
                    onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                    disabled={loading}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be used when searching for nearby stores
                  </p>
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Radius'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Separator />

          {/* Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Password
              </CardTitle>
              <CardDescription>
                Change your password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Separator />

          {/* Social Links */}
          {userId && (
            <SocialLinksEditor
              userId={userId}
              currentLinks={socialLinks}
              onUpdate={(links) => setSocialLinks(links)}
            />
          )}

          <Separator />

          {/* Profile Customization */}
          <ProfileCustomization />
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default ProfileManagement;