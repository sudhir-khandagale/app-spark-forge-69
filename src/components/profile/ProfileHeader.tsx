import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Flame, Twitter, Linkedin, Instagram, Github, Globe } from "lucide-react";
import { useUserLevel } from "@/hooks/useUserLevel";
import { useStreak } from "@/hooks/useStreak";
import { useUserRole } from "@/hooks/useUserRole";
import { LevelProgress } from "./LevelProgress";
import { Button } from "@/components/ui/button";

interface ProfileHeaderProps {
  avatarUrl?: string;
  displayName?: string;
  location?: string;
  joinDate?: string;
  bannerUrl?: string;
  socialLinks?: Record<string, string>;
}

export const ProfileHeader = ({ avatarUrl, displayName, location, joinDate, bannerUrl, socialLinks }: ProfileHeaderProps) => {
  const { userLevel } = useUserLevel();
  const { streakInfo } = useStreak();
  const { user } = useUserRole();

  const getLevelColor = (level: number) => {
    const colors = {
      1: "bg-blue-500",
      2: "bg-orange-600", 
      3: "bg-gray-400",
      4: "bg-yellow-500",
      5: "bg-purple-600"
    };
    return colors[level as keyof typeof colors] || "bg-gray-400";
  };

  const getSocialIcon = (platform: string) => {
    const icons: Record<string, any> = {
      twitter: Twitter,
      linkedin: Linkedin,
      instagram: Instagram,
      github: Github,
      website: Globe,
    };
    return icons[platform] || Globe;
  };

  return (
    <Card className="overflow-hidden mb-6">
      {/* Banner Image */}
      {bannerUrl && (
        <div className="w-full h-48 overflow-hidden bg-muted">
          <img 
            src={bannerUrl} 
            alt="Profile banner" 
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-6 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="flex items-start gap-4">
          {/* Avatar with Level Ring */}
          <div className="relative -mt-16">
            <div className={`absolute inset-0 rounded-full ${getLevelColor(userLevel?.level || 1)} opacity-20 blur-xl`}></div>
            <div className={`relative ring-4 ${getLevelColor(userLevel?.level || 1)} ring-opacity-50 rounded-full bg-background`}>
              <Avatar className="w-24 h-24">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
                  {displayName?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
            <Badge className={`absolute -bottom-2 left-1/2 -translate-x-1/2 ${getLevelColor(userLevel?.level || 1)} text-white border-0`}>
              {userLevel?.level || 1}
            </Badge>
          </div>

          {/* User Info */}
          <div className="flex-1 mt-8">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold">{displayName || user?.email || "Anonymous"}</h2>
              {streakInfo && streakInfo.current_streak > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/10 rounded-full">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-semibold text-orange-500">
                    {streakInfo.current_streak} day streak
                  </span>
                </div>
              )}
            </div>

            {/* Social Links */}
            {socialLinks && Object.keys(socialLinks).length > 0 && (
              <div className="flex gap-2 mb-3">
                {Object.entries(socialLinks).map(([platform, url]) => {
                  const Icon = getSocialIcon(platform);
                  return (
                    <Button
                      key={platform}
                      variant="ghost"
                      size="icon"
                      asChild
                      className="h-8 w-8"
                    >
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        <Icon className="w-4 h-4" />
                      </a>
                    </Button>
                  );
                })}
              </div>
            )}

            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
              {location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {location}
                </div>
              )}
              {joinDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Joined {new Date(joinDate).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Level Progress */}
            <div className="mb-2">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-semibold">{userLevel?.level_name || "New Explorer"}</span>
                <span className="text-muted-foreground">
                  {userLevel?.current_points || 0} / {userLevel?.next_level_points || 51} pts
                </span>
              </div>
              <LevelProgress
                currentPoints={userLevel?.current_points || 0}
                nextLevelPoints={userLevel?.next_level_points || 51}
                level={userLevel?.level || 1}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
