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

  const getCompletionColor = () => {
    if (percentage >= 80) return 'from-green-500 to-emerald-500';
    if (percentage >= 50) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-rose-500';
  };

  return (
    <Card className="border-2 hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Profile Completion
          {percentage === 100 && <span className="text-2xl">🎉</span>}
        </CardTitle>
        <CardDescription>
          Complete your profile to unlock all features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="font-bold text-lg">{percentage}% Complete</span>
            <span className="text-muted-foreground">
              {completedCount} of {totalCount} items
            </span>
          </div>
          <div className="relative">
            <Progress value={percentage} className="h-3" />
            <div 
              className={`absolute inset-0 h-3 bg-gradient-to-r ${getCompletionColor()} rounded-full transition-all duration-500`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        <div className="grid gap-2">
          {checks.map((check, index) => (
            <div 
              key={index} 
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                check.completed ? 'bg-primary/5' : 'hover:bg-muted/50'
              }`}
            >
              {check.completed ? (
                <CheckCircle2 className="w-5 h-5 text-primary animate-in zoom-in" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground" />
              )}
              <span className={`text-sm ${check.completed ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {check.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
