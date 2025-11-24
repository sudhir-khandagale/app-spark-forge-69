import { Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface LockedFeatureOverlayProps {
  isLocked: boolean;
  onUpgrade: () => void;
  title: string;
  description: string;
  requiredTier: 'pro' | 'premium';
  children: React.ReactNode;
}

export default function LockedFeatureOverlay({
  isLocked,
  onUpgrade,
  title,
  description,
  requiredTier,
  children
}: LockedFeatureOverlayProps) {
  return (
    <div className="relative">
      <div className={cn(
        "transition-all duration-500",
        isLocked && "blur-sm opacity-50 pointer-events-none select-none"
      )}>
        {children}
      </div>
      
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center z-10 animate-fade-in">
          <Card className="max-w-md p-8 text-center shadow-2xl border-2 animate-scale-in">
            <div className="mb-4 flex justify-center">
              <div className="relative">
                <Lock className="h-16 w-16 text-primary animate-pulse" />
                <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1 animate-bounce" />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold mb-2">{title}</h3>
            <p className="text-muted-foreground mb-6">{description}</p>
            
            <div className="mb-4">
              <div className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold",
                requiredTier === 'premium' 
                  ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300"
                  : "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
              )}>
                {requiredTier === 'premium' ? '👑 Premium' : '⭐ Pro'} Plan Required
              </div>
            </div>
            
            <Button 
              onClick={onUpgrade}
              size="lg"
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Upgrade to {requiredTier === 'premium' ? 'Premium' : 'Pro'}
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
