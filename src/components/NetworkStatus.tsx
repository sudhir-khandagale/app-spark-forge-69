import { useEffect } from 'react';
import { useNativeFeatures } from '@/hooks/useNativeFeatures';
import { toast } from '@/hooks/use-toast';
import { WifiOff } from 'lucide-react';

export const NetworkStatus = () => {
  const { isOnline, isNative } = useNativeFeatures();

  useEffect(() => {
    if (!isNative) return;

    if (!isOnline) {
      toast({
        title: 'You are offline',
        description: 'Some features may not be available',
        variant: 'destructive',
        duration: Infinity,
      });
    }
  }, [isOnline, isNative]);

  if (!isNative || isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground py-2 px-4 flex items-center justify-center gap-2">
      <WifiOff className="w-4 h-4" />
      <span className="text-sm font-medium">No internet connection</span>
    </div>
  );
};
