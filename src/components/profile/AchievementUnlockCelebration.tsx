import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

interface AchievementUnlockCelebrationProps {
  achievement: {
    name: string;
    description: string;
    icon: string;
    points_reward: number;
  } | null;
  open: boolean;
  onClose: () => void;
}

export const AchievementUnlockCelebration = ({
  achievement,
  open,
  onClose,
}: AchievementUnlockCelebrationProps) => {
  useEffect(() => {
    if (open) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [open]);

  if (!achievement) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="space-y-4"
        >
          <div className="text-6xl">{achievement.icon}</div>
          <h2 className="text-2xl font-bold">Achievement Unlocked!</h2>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-primary">{achievement.name}</h3>
            <p className="text-muted-foreground">{achievement.description}</p>
            <div className="mt-4 p-3 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-lg">
              <p className="font-bold text-lg">+{achievement.points_reward} Points Earned!</p>
            </div>
          </div>
          <Button onClick={onClose} className="w-full">
            Awesome!
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};