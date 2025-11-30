import { MapPin, Loader2, Locate } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/BackButton';
import { Input } from '@/components/ui/input';
import RoleBasedBottomNav from '@/components/RoleBasedBottomNav';
import GoogleMap from '@/components/GoogleMap';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useState, useEffect } from 'react';
import { useStores } from '@/hooks/useStores';
import { useProductSearch } from '@/hooks/useProducts';

const MapView = () => {
  const navigate = useNavigate();
  const { latitude, longitude, loading: locationLoading, error, refresh: refreshLocation } = useGeolocation();
  const [searchQuery, setSearchQuery] = useState('');
  const { stores, loading: storesLoading } = useStores(latitude || undefined, longitude || undefined);
  const { results, loading: searchLoading, searchProducts } = useProductSearch();
  const [selectedStore, setSelectedStore] = useState<any>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && latitude && longitude) {
      searchProducts(searchQuery, latitude, longitude);
    }
  };

  // Use search results if available, otherwise show all stores
  const displayData = results.length > 0 ? results : stores;

  useEffect(() => {
    if (displayData.length > 0 && !selectedStore) {
      setSelectedStore(displayData[0]);
    }
  }, [displayData, selectedStore]);

  const markers = displayData
    .filter(item => {
      const lat = 'latitude' in item ? item.latitude : item.store_latitude;
      const lng = 'longitude' in item ? item.longitude : item.store_longitude;
      return lat && lng;
    })
    .map(item => {
      const isStore = 'latitude' in item;
      return {
        position: {
          lat: isStore ? item.latitude! : item.store_latitude!,
          lng: isStore ? item.longitude! : item.store_longitude!
        },
        title: isStore ? item.name : item.name,
        storeName: isStore ? item.name : item.store_name,
        storeId: isStore ? item.id : item.store_id,
        price: !isStore ? `$${item.price.toFixed(2)}` : undefined,
        inStock: !isStore ? item.in_stock : true,
        data: item
      };
    });

  const mapCenter = latitude && longitude 
    ? { lat: latitude, lng: longitude }
    : { lat: 40.7580, lng: -73.9855 };

  const handleMarkerClick = (marker: any) => {
    setSelectedStore(marker.data);
  };

  const isLoading = locationLoading || storesLoading || searchLoading;

  return (
    <div className="flex flex-col min-h-screen pb-16">
      {/* Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <form onSubmit={handleSearch} className="flex items-center gap-2 bg-background rounded-lg shadow-lg p-2">
          <BackButton fallbackPath="/" />
          <Input
            placeholder="Search on map..."
            className="border-0 shadow-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button 
            size="icon" 
            variant="ghost"
            onClick={refreshLocation}
            disabled={locationLoading}
            type="button"
          >
            <Locate className={`w-5 h-5 ${locationLoading ? 'animate-spin' : ''}`} />
          </Button>
        </form>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-full bg-muted">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full bg-muted">
            <div className="text-center p-6">
              <p className="text-destructive font-semibold mb-2">Location Error</p>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={refreshLocation}>
                <Locate className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        ) : markers.length === 0 ? (
          <div className="flex items-center justify-center h-full bg-muted">
            <div className="text-center p-6">
              <p className="text-muted-foreground mb-2">No stores found</p>
              <p className="text-sm text-muted-foreground">Try searching or adjusting your location</p>
            </div>
          </div>
        ) : null}
        
        <GoogleMap
          center={mapCenter}
          zoom={14}
          markers={markers}
          onMarkerClick={handleMarkerClick}
        />
      </div>

      {/* Store Info Card */}
      {selectedStore && (
        <div className="absolute bottom-20 left-4 right-4 z-10">
          <div className="bg-card rounded-lg shadow-lg p-4 border border-border">
            <h3 className="font-semibold mb-1">
              {'store_name' in selectedStore ? selectedStore.store_name : selectedStore.name}
            </h3>
            {'description' in selectedStore && selectedStore.description && (
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {selectedStore.description}
              </p>
            )}
            {selectedStore.price && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg font-semibold text-primary">${selectedStore.price}</span>
                <span className={`text-sm ${selectedStore.in_stock ? 'text-accent' : 'text-destructive'}`}>
                  {selectedStore.in_stock ? '✓ In Stock' : '✗ Out of Stock'}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              {selectedStore.distance && (
                <span className="text-sm text-primary">{selectedStore.distance.toFixed(1)} mi away</span>
              )}
              <div className="flex gap-2 ml-auto">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => navigate(`/store/${'store_id' in selectedStore ? selectedStore.store_id : selectedStore.id}`)}
                >
                  View Store
                </Button>
                {((selectedStore.latitude || selectedStore.store_latitude) && 
                  (selectedStore.longitude || selectedStore.store_longitude)) && (
                  <Button 
                    size="sm"
                    onClick={() => {
                      const lat = selectedStore.latitude || selectedStore.store_latitude;
                      const lng = selectedStore.longitude || selectedStore.store_longitude;
                      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
                    }}
                  >
                    Directions
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <RoleBasedBottomNav />
    </div>
  );
};

export default MapView;
