import { useEffect } from 'react';
import { useNativeFeatures } from '@/hooks/useNativeFeatures';
import { useTheme } from '@/components/theme-provider';

export const AppInitializer = () => {
  const { statusBar, isNative } = useNativeFeatures();
  const { theme } = useTheme();

  useEffect(() => {
    if (!isNative) return;

    // Initialize status bar based on theme
    const initStatusBar = async () => {
      if (theme === 'dark') {
        await statusBar.setDark();
        await statusBar.setBackgroundColor('#020817'); // slate-950
      } else {
        await statusBar.setLight();
        await statusBar.setBackgroundColor('#2563eb'); // primary blue
      }
    };

    initStatusBar();
  }, [theme, statusBar, isNative]);

  return null;
};
