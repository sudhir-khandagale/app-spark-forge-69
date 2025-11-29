import { MapPin, Calendar, ExternalLink, Sparkles, Twitter, Linkedin, Instagram, Github, Globe } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserLevel } from '@/hooks/useUserLevel';
import { useStreak } from '@/hooks/useStreak';
import { LevelProgress } from './LevelProgress';
import { useUserRole } from '@/hooks/useUserRole';
import { motion } from 'framer-motion';

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
      1: 'from-blue-500 to-blue-600',
      2: 'from-orange-500 to-orange-600', 
      3: 'from-gray-400 to-gray-500',
      4: 'from-yellow-500 to-yellow-600',
      5: 'from-purple-500 to-purple-600'
    };
    return colors[level as keyof typeof colors] || 'from-gray-400 to-gray-500';
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden border-2 shadow-xl">
        {/* Enhanced Banner with Gradient Overlay */}
        <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20">
          {bannerUrl && (
            <img 
              src={bannerUrl} 
              alt="Profile banner" 
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          
          {/* Floating decorative elements */}
          <div className="absolute top-4 right-4 animate-pulse">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
        </div>
        
        <div className="p-6 -mt-16 relative">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Enhanced Avatar with Animated Level Ring */}
            <motion.div 
              className="relative flex-shrink-0"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className={`w-32 h-32 rounded-full p-1 bg-gradient-to-br ${getLevelColor(userLevel?.level || 1)} shadow-2xl animate-pulse`}>
                <Avatar className="w-full h-full border-4 border-background ring-2 ring-primary/20">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
                    {displayName?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
              {userLevel && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-sm font-bold bg-gradient-to-r ${getLevelColor(userLevel.level)} text-white shadow-lg border-2 border-background`}
                >
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    LVL {userLevel.level}
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Enhanced User Info */}
            <div className="flex-1 space-y-4">
              <div>
                <motion.h2 
                  className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {displayName || user?.email || 'User'}
                </motion.h2>
                {userLevel && (
                  <Badge variant="secondary" className="mt-2">
                    {userLevel.level_name}
                  </Badge>
                )}
                {streakInfo && streakInfo.current_streak > 0 && (
                  <motion.div 
                    className="flex items-center gap-2 text-sm mt-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                  >
                    <span className="text-2xl animate-pulse">🔥</span>
                    <span className="font-semibold text-orange-500">
                      {streakInfo.current_streak} day streak
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Enhanced Social Links */}
              {socialLinks && Object.keys(socialLinks).length > 0 && (
                <motion.div 
                  className="flex flex-wrap gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {Object.entries(socialLinks).map(([platform, url], index) => {
                    const Icon = getSocialIcon(platform);
                    if (!url) return null;
                    return (
                      <motion.div
                        key={platform}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="gap-2 hover:scale-105 transition-transform"
                        >
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <Icon className="w-4 h-4" />
                            {platform.charAt(0).toUpperCase() + platform.slice(1)}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </Button>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}

              <motion.div 
                className="flex flex-wrap gap-4 text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
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
              </motion.div>

              {/* Enhanced Level Progress */}
              {userLevel && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-foreground">Level Progress</span>
                      <span className="text-muted-foreground">
                        {userLevel.current_points} / {userLevel.next_level_points} pts
                      </span>
                    </div>
                    <LevelProgress 
                      currentPoints={userLevel.current_points}
                      nextLevelPoints={userLevel.next_level_points}
                      level={userLevel.level}
                    />
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};