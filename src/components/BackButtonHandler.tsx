import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { toast } from '@/hooks/use-toast';

let lastBackPress = 0;

export const BackButtonHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!isNative) return;

    let listenerHandle: any;

    CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      const isHomePage = location.pathname === '/';

      if (!canGoBack || isHomePage) {
        // Double tap to exit on home page
        const now = Date.now();
        if (now - lastBackPress < 2000) {
          CapacitorApp.exitApp();
        } else {
          lastBackPress = now;
          toast({
            title: 'Press back again to exit',
            duration: 2000,
          });
        }
      } else {
        // Navigate back
        navigate(-1);
      }
    }).then(handle => {
      listenerHandle = handle;
    });

    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, [navigate, location, isNative]);

  return null;
};
