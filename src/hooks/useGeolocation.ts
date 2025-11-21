import { useState, useEffect } from 'react';
import { Geolocation } from '@capacitor/geolocation';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

export const useGeolocation = () => {
  const [location, setLocation] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
  });

  const getCurrentPosition = async () => {
    try {
      setLocation(prev => ({ ...prev, loading: true, error: null }));
      
      // Request permissions
      const permission = await Geolocation.checkPermissions();
      
      if (permission.location === 'denied') {
        const requested = await Geolocation.requestPermissions();
        if (requested.location === 'denied') {
          throw new Error('Location permission denied');
        }
      }

      // Get current position
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });

      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        error: null,
        loading: false,
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch (error: any) {
      console.error('Geolocation error:', error);
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
    getCurrentPosition();
  }, []);

  return {
    ...location,
    refresh: getCurrentPosition,
  };
};
