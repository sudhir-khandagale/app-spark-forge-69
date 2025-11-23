import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Locate, Search } from 'lucide-react';

interface LocationPickerProps {
  address: string;
  latitude: string;
  longitude: string;
  onLocationChange: (data: { address: string; latitude: string; longitude: string }) => void;
}

const LocationPicker = ({ address, latitude, longitude, onLocationChange }: LocationPickerProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(address);

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;

      try {
        // Load Google Maps script
        if (!window.google || !window.google.maps) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMaps`;
            script.async = true;
            script.defer = true;
            
            (window as any).initGoogleMaps = () => {
              resolve();
            };
            
            script.onerror = () => reject(new Error('Failed to load Google Maps'));
            document.head.appendChild(script);
          });
        }

        const initialCenter = latitude && longitude 
          ? { lat: parseFloat(latitude), lng: parseFloat(longitude) }
          : { lat: 40.7128, lng: -74.0060 }; // Default to NYC

        // Create map
        mapInstanceRef.current = new google.maps.Map(mapRef.current, {
          center: initialCenter,
          zoom: 15,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        // Create marker
        markerRef.current = new google.maps.Marker({
          position: initialCenter,
          map: mapInstanceRef.current,
          draggable: true,
          title: 'Your Store Location',
        });

        // Handle marker drag
        markerRef.current.addListener('dragend', async () => {
          if (!markerRef.current) return;
          const position = markerRef.current.getPosition();
          if (position) {
            await updateLocationFromLatLng(position.lat(), position.lng());
          }
        });

        // Handle map click
        mapInstanceRef.current.addListener('click', async (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            
            if (markerRef.current) {
              markerRef.current.setPosition({ lat, lng });
            }
            
            await updateLocationFromLatLng(lat, lng);
          }
        });

        // Setup autocomplete
        if (searchInputRef.current) {
          autocompleteRef.current = new google.maps.places.Autocomplete(searchInputRef.current, {
            fields: ['formatted_address', 'geometry'],
          });

          autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current?.getPlace();
            if (place?.geometry?.location) {
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              
              if (mapInstanceRef.current) {
                mapInstanceRef.current.setCenter({ lat, lng });
              }
              
              if (markerRef.current) {
                markerRef.current.setPosition({ lat, lng });
              }
              
              onLocationChange({
                address: place.formatted_address || '',
                latitude: lat.toString(),
                longitude: lng.toString(),
              });
              
              setSearchQuery(place.formatted_address || '');
            }
          });
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error loading Google Maps:', err);
        setError('Failed to load map. Please check your API key.');
        setIsLoading(false);
      }
    };

    initMap();
  }, []);

  const updateLocationFromLatLng = async (lat: number, lng: number) => {
    try {
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ location: { lat, lng } });
      
      if (result.results[0]) {
        const formattedAddress = result.results[0].formatted_address;
        setSearchQuery(formattedAddress);
        onLocationChange({
          address: formattedAddress,
          latitude: lat.toString(),
          longitude: lng.toString(),
        });
      }
    } catch (err) {
      console.error('Error geocoding:', err);
    }
  };

  const handleGetCurrentLocation = () => {
    if ('geolocation' in navigator) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter({ lat, lng });
          }
          
          if (markerRef.current) {
            markerRef.current.setPosition({ lat, lng });
          }
          
          await updateLocationFromLatLng(lat, lng);
          setIsLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Failed to get current location');
          setIsLoading(false);
        }
      );
    }
  };

  if (error && !mapInstanceRef.current) {
    return (
      <div className="flex items-center justify-center h-96 bg-muted rounded-lg border border-border">
        <div className="text-center p-6">
          <p className="text-destructive font-semibold mb-2">Map Error</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Search Location
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search for your store address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleGetCurrentLocation}
            disabled={isLoading}
          >
            <Locate className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Click on the map or drag the marker to set your exact location
        </p>
      </div>

      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10 rounded-lg">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading map...</p>
            </div>
          </div>
        )}
        <div ref={mapRef} className="w-full h-96 rounded-lg border border-border" />
      </div>

      <div className="grid grid-cols-2 gap-4 pt-2">
        <div className="space-y-2">
          <Label htmlFor="lat-display">Latitude</Label>
          <Input
            id="lat-display"
            value={latitude}
            readOnly
            className="bg-muted"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lng-display">Longitude</Label>
          <Input
            id="lng-display"
            value={longitude}
            readOnly
            className="bg-muted"
          />
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
