import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Sparkles, Star } from "lucide-react";

interface LevelUpCelebrationProps {
  level: number;
  levelName: string;
  open: boolean;
  onClose: () => void;
}

export const LevelUpCelebration = ({ 
  level, 
  levelName, 
  open, 
  onClose 
}: LevelUpCelebrationProps) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (open) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const getLevelColor = (level: number) => {
    const colors = {
      1: "from-blue-500 to-blue-600",
      2: "from-orange-500 to-orange-600",
      3: "from-gray-400 to-gray-500",
      4: "from-yellow-400 to-yellow-600",
      5: "from-purple-500 via-pink-500 to-purple-600"
    };
    return colors[level as keyof typeof colors] || "from-blue-500 to-blue-600";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <div className={`absolute inset-0 bg-gradient-to-r ${getLevelColor(level)} blur-3xl opacity-50 animate-pulse`}></div>
                <div className={`relative w-32 h-32 rounded-full bg-gradient-to-r ${getLevelColor(level)} flex items-center justify-center shadow-2xl`}>
                  <Trophy className="w-16 h-16 text-white" />
                  <div className="absolute -top-2 -right-2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      {level}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <DialogTitle className="text-center text-3xl">
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-8 h-8 text-yellow-500 animate-pulse" />
                Level Up!
                <Sparkles className="w-8 h-8 text-yellow-500 animate-pulse" />
              </span>
            </DialogTitle>
            <DialogDescription className="text-center text-lg">
              Congratulations! You've reached
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Level Name */}
            <div className="text-center">
              <div className={`inline-block text-3xl font-bold bg-gradient-to-r ${getLevelColor(level)} bg-clip-text text-transparent`}>
                {levelName}
              </div>
            </div>

            {/* Perks */}
            <div className="bg-primary/5 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 font-semibold mb-3">
                <Star className="w-5 h-5 text-yellow-500" />
                <span>New Perks Unlocked</span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>+50 bonus points</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Access to exclusive achievements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Enhanced profile badge</span>
                </li>
                {level >= 3 && (
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Priority support access</span>
                  </li>
                )}
              </ul>
            </div>

            {/* CTA */}
            <Button onClick={onClose} className="w-full" size="lg">
              Continue Shopping
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

