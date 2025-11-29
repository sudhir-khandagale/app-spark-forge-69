import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProfileCustomization } from "@/hooks/useProfileCustomization";
import { Settings, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export const ProfileCustomization = () => {
  const { preferences, loading, updatePreferences } = useProfileCustomization();
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    preferences?.shopping_interests || []
  );

  const interests = [
    "Electronics", "Fashion", "Groceries", "Home & Garden", 
    "Sports", "Books", "Toys", "Beauty", "Automotive", "Health"
  ];

  const handleInterestToggle = (interest: string) => {
    const updated = selectedInterests.includes(interest)
      ? selectedInterests.filter(i => i !== interest)
      : [...selectedInterests, interest];
    
    setSelectedInterests(updated);
  };

  const handleSave = async () => {
    await updatePreferences({
      shopping_interests: selectedInterests
    });
  };

  if (loading || !preferences) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Profile Customization
        </CardTitle>
        <CardDescription>
          Personalize your shopping experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Shopping Interests */}
        <div className="space-y-3">
          <Label>Shopping Interests</Label>
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => (
              <Badge
                key={interest}
                variant={selectedInterests.includes(interest) ? "default" : "outline"}
                className="cursor-pointer hover:scale-105 transition-transform"
                onClick={() => handleInterestToggle(interest)}
              >
                {interest}
              </Badge>
            ))}
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="space-y-4">
          <Label>Privacy Settings</Label>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Public Profile</div>
              <div className="text-sm text-muted-foreground">
                Allow others to see your profile and achievements
              </div>
            </div>
            <Switch
              checked={preferences.profile_visibility === 'public'}
              onCheckedChange={(checked) =>
                updatePreferences({ 
                  profile_visibility: checked ? 'public' : 'private' 
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Activity Sharing</div>
              <div className="text-sm text-muted-foreground">
                Share your activities with friends
              </div>
            </div>
            <Switch
              checked={preferences.activity_sharing}
              onCheckedChange={(checked) =>
                updatePreferences({ activity_sharing: checked })
              }
            />
          </div>
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} className="w-full">
          Save Preferences
        </Button>
      </CardContent>
    </Card>
  );
};
