import { useState, useEffect } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { safeStorage } from '@/lib/safeStorage';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

export const useGeolocation = () => {
  // Load cached location immediately (synchronous)
  const getCachedLocation = () => {
    const cached = safeStorage.getItem('userLocation');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return null;
      }
    }
    return null;
  };

  const cachedLocation = getCachedLocation();
  const [location, setLocation] = useState<GeolocationState>({
    latitude: cachedLocation?.latitude || null,
    longitude: cachedLocation?.longitude || null,
    error: null,
    loading: !cachedLocation, // Only loading if no cache
  });

  const getCurrentPosition = async () => {
    try {
      setLocation(prev => ({ ...prev, loading: true, error: null }));
      
      // Check if running in native app or web browser
      const isNative = (window as any).Capacitor?.isNativePlatform?.();
      
      if (isNative) {
        // Use Capacitor Geolocation for native apps
        const permission = await Geolocation.checkPermissions();
        
        if (permission.location === 'denied') {
          const requested = await Geolocation.requestPermissions();
          if (requested.location === 'denied') {
            throw new Error('Location permission denied');
          }
        }

        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 300000
        });

        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false,
        };

        setLocation(newLocation);
        safeStorage.setItem('userLocation', JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));

        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      } else {
        // Use browser Geolocation API for web
        if (!navigator.geolocation) {
          throw new Error('Geolocation not supported');
        }

        return new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const newLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                error: null,
                loading: false,
              };

              setLocation(newLocation);
              safeStorage.setItem('userLocation', JSON.stringify({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              }));

              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
            },
            (error) => {
              reject(new Error(error.message));
            },
            {
              enableHighAccuracy: false,
              timeout: 5000,
              maximumAge: 300000
            }
          );
        });
      }
    } catch (error: any) {
      // Silent fail - use cached location if available
      const cached = safeStorage.getItem('userLocation');
      if (cached) {
        try {
          const { latitude, longitude } = JSON.parse(cached);
          setLocation({
            latitude,
            longitude,
            error: null,
            loading: false,
          });
          return { latitude, longitude };
        } catch {
          // Invalid cache
        }
      }

      console.error('Geolocation error:', error?.message || 'Unknown error');
      setLocation({
        latitude: null,
        longitude: null,
        error: error.message || 'Failed to get location',
        loading: false,
      });
      return null;
    }
  };

  useEffect(() => {
    // Only fetch if we don't have cached location
    if (!cachedLocation) {
      getCurrentPosition();
    }
  }, []);

  return {
    ...location,
    refresh: getCurrentPosition,
  };
};
