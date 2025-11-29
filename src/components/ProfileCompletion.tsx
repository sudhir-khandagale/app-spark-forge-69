import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle } from 'lucide-react';

interface ProfileCompletionProps {
  profile: {
    display_name?: string | null;
    avatar_url?: string | null;
    banner_url?: string | null;
    phone?: string | null;
    email?: string | null;
    social_links?: any;
  };
  preferences: {
    shopping_interests?: string[];
  };
}

export const ProfileCompletion = ({ profile, preferences }: ProfileCompletionProps) => {
  const checks = [
    { label: 'Display Name', completed: !!profile.display_name },
    { label: 'Email', completed: !!profile.email },
    { label: 'Phone Number', completed: !!profile.phone },
    { label: 'Profile Picture', completed: !!profile.avatar_url },
    { label: 'Banner Image', completed: !!profile.banner_url },
    { label: 'Shopping Interests', completed: preferences.shopping_interests && preferences.shopping_interests.length > 0 },
    { label: 'Social Links', completed: profile.social_links && Object.keys(profile.social_links).length > 0 },
  ];

  const completedCount = checks.filter(check => check.completed).length;
  const totalCount = checks.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Completion</CardTitle>
        <CardDescription>
          Complete your profile to get the most out of AassPass
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{percentage}% Complete</span>
            <span className="text-muted-foreground">
              {completedCount} of {totalCount} items
            </span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>

        <div className="space-y-2">
          {checks.map((check, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              {check.completed ? (
                <CheckCircle2 className="w-4 h-4 text-primary" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground" />
              )}
              <span className={check.completed ? 'text-foreground' : 'text-muted-foreground'}>
                {check.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
