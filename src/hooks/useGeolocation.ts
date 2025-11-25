import { useState, useEffect } from 'react';
import { Geolocation } from '@capacitor/geolocation';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

export const useGeolocation = () => {
  // Load cached location immediately (synchronous)
  const getCachedLocation = () => {
    const cached = localStorage.getItem('userLocation');
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
      
      // Request permissions
      const permission = await Geolocation.checkPermissions();
      
      if (permission.location === 'denied') {
        const requested = await Geolocation.requestPermissions();
        if (requested.location === 'denied') {
          throw new Error('Location permission denied');
        }
      }

      // Get current position with optimized settings
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: false, // Use false for better mobile performance
        timeout: 5000, // Reduced timeout
        maximumAge: 300000 // Cache for 5 minutes
      });

      const newLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        error: null,
        loading: false,
      };

      setLocation(newLocation);
      
      // Cache location
      localStorage.setItem('userLocation', JSON.stringify({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }));

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch (error: any) {
      // Silent fail - use cached location if available
      const cached = localStorage.getItem('userLocation');
      if (cached) {
        const { latitude, longitude } = JSON.parse(cached);
        setLocation({
          latitude,
          longitude,
          error: null,
          loading: false,
        });
        return { latitude, longitude };
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
