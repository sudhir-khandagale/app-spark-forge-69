import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, User, Heart, MapPin, Trophy } from 'lucide-react';
import { AvatarUpload } from '@/components/AvatarUpload';

const ProfileOnboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState<string>('');
  const totalSteps = 5;

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

  const [data, setData] = useState({
    displayName: '',
    avatarUrl: null as string | null,
    interests: [] as string[],
    shopTypes: [] as string[],
    searchRadius: 10,
  });

  const interestOptions = [
    'Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books',
    'Food & Beverage', 'Health & Beauty', 'Toys & Games'
  ];

  const shopTypeOptions = [
    'Boutique Shops', 'Department Stores', 'Specialty Stores',
    'Local Markets', 'Chain Stores', 'Online Retailers'
  ];

  const toggleSelection = (field: 'interests' | 'shopTypes', value: string) => {
    setData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  const handleSkip = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Mark onboarding as completed without awarding points
      await supabase
        .from('user_preferences')
        .update({
          onboarding_completed: true,
        })
        .eq('user_id', user.id);

      navigate('/profile');
    } catch (error) {
      console.error('Skip onboarding error:', error);
      toast({
        title: 'Error',
        description: 'Failed to skip onboarding',
        variant: 'destructive',
      });
    }
  };

  const handleComplete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update profile
      await supabase
        .from('profiles')
        .update({
          display_name: data.displayName,
          avatar_url: data.avatarUrl,
          search_radius: data.searchRadius,
        })
        .eq('id', user.id);

      // Update preferences
      await supabase
        .from('user_preferences')
        .update({
          shopping_interests: data.interests,
          preferred_shop_types: data.shopTypes,
          onboarding_completed: true,
        })
        .eq('user_id', user.id);

      // Award welcome achievement points
      await supabase.rpc('award_points', {
        p_user_id: user.id,
        p_points: 50,
        p_action_type: 'onboarding',
        p_description: 'Completed profile setup',
      });

      toast({
        title: 'Welcome aboard! 🎉',
        description: 'You earned 50 points for completing setup!',
      });

      navigate('/profile');
    } catch (error) {
      console.error('Onboarding error:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete onboarding',
        variant: 'destructive',
      });
    }
  };

  const progress = (step / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <CardTitle>Welcome to AassPass!</CardTitle>
            <Badge variant="secondary">Step {step} of {totalSteps}</Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="text-center space-y-4">
              <Sparkles className="w-16 h-16 mx-auto text-primary" />
              <h2 className="text-2xl font-bold">Let's Get Started!</h2>
              <p className="text-muted-foreground">
                We'll help you set up your profile in just a few steps.
                Discover local products, earn rewards, and shop smarter!
              </p>
              <div className="flex gap-2">
                <Button onClick={handleSkip} variant="outline" className="flex-1">
                  Skip for Now
                </Button>
                <Button onClick={() => setStep(2)} className="flex-1">
                  Get Started
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <User className="w-12 h-12 mx-auto text-primary mb-2" />
                <h2 className="text-xl font-bold">Profile Photo</h2>
                <p className="text-sm text-muted-foreground">Add a photo to personalize your account</p>
              </div>
              <AvatarUpload
                currentAvatarUrl={data.avatarUrl || undefined}
                userId={userId}
                onUploadComplete={(url) => setData(prev => ({ ...prev, avatarUrl: url }))}
              />
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  placeholder="Enter your name"
                  value={data.displayName}
                  onChange={(e) => setData(prev => ({ ...prev, displayName: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="flex-1"
                  disabled={!data.displayName.trim()}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <Heart className="w-12 h-12 mx-auto text-primary mb-2" />
                <h2 className="text-xl font-bold">Your Interests</h2>
                <p className="text-sm text-muted-foreground">Select categories you're interested in</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {interestOptions.map((interest) => (
                  <Badge
                    key={interest}
                    variant={data.interests.includes(interest) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleSelection('interests', interest)}
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setStep(4)} className="flex-1">
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <MapPin className="w-12 h-12 mx-auto text-primary mb-2" />
                <h2 className="text-xl font-bold">Preferred Shop Types</h2>
                <p className="text-sm text-muted-foreground">What type of stores do you prefer?</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {shopTypeOptions.map((type) => (
                  <Badge
                    key={type}
                    variant={data.shopTypes.includes(type) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleSelection('shopTypes', type)}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
              <div className="space-y-2">
                <Label>Search Radius: {data.searchRadius} km</Label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={data.searchRadius}
                  onChange={(e) => setData(prev => ({ ...prev, searchRadius: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setStep(5)} className="flex-1">
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="text-center space-y-4">
              <Trophy className="w-16 h-16 mx-auto text-yellow-500" />
              <h2 className="text-2xl font-bold">You're All Set!</h2>
              <p className="text-muted-foreground">
                Start discovering local products, earning points, and unlocking achievements!
              </p>
              <div className="bg-gradient-to-r from-yellow-400/20 to-orange-500/20 p-4 rounded-lg">
                <p className="font-bold text-lg">🎁 +50 Welcome Points!</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(4)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleComplete} className="flex-1">
                  Start Shopping!
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileOnboarding;