import { useEffect, useState } from 'react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

export const useNativeFeatures = () => {
  const [isOnline, setIsOnline] = useState(true);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!isNative) return;

    let listenerHandle: any;

    // Network status monitoring
    Network.addListener('networkStatusChange', status => {
      setIsOnline(status.connected);
    }).then(handle => {
      listenerHandle = handle;
    });

    // Get initial network status
    Network.getStatus().then(status => {
      setIsOnline(status.connected);
    });

    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, [isNative]);

  const haptic = {
    light: async () => {
      if (!isNative) return;
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (e) {
        console.log('Haptics not available');
      }
    },
    medium: async () => {
      if (!isNative) return;
      try {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } catch (e) {
        console.log('Haptics not available');
      }
    },
    heavy: async () => {
      if (!isNative) return;
      try {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } catch (e) {
        console.log('Haptics not available');
      }
    },
    success: async () => {
      if (!isNative) return;
      try {
        await Haptics.notification({ type: NotificationType.Success });
      } catch (e) {
        console.log('Haptics not available');
      }
    },
    error: async () => {
      if (!isNative) return;
      try {
        await Haptics.notification({ type: NotificationType.Error });
      } catch (e) {
        console.log('Haptics not available');
      }
    },
  };

  const statusBar = {
    setLight: async () => {
      if (!isNative) return;
      try {
        await StatusBar.setStyle({ style: Style.Light });
      } catch (e) {
        console.log('StatusBar not available');
      }
    },
    setDark: async () => {
      if (!isNative) return;
      try {
        await StatusBar.setStyle({ style: Style.Dark });
      } catch (e) {
        console.log('StatusBar not available');
      }
    },
    setBackgroundColor: async (color: string) => {
      if (!isNative) return;
      try {
        await StatusBar.setBackgroundColor({ color });
      } catch (e) {
        console.log('StatusBar not available');
      }
    },
  };

  return {
    isNative,
    isOnline,
    haptic,
    statusBar,
  };
};
