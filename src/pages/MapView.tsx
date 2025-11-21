import { ArrowLeft, MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BottomNav from '@/components/BottomNav';
import GoogleMap from '@/components/GoogleMap';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useState } from 'react';

const MapView = () => {
  const navigate = useNavigate();
  const { latitude, longitude, loading, error } = useGeolocation();
  const [searchQuery, setSearchQuery] = useState('');

  // Mock store data - in production, this would come from your database
  const mockStores = [
    {
      id: '1',
      position: { lat: 40.7580, lng: -73.9855 },
      title: 'Times Square Electronics',
      storeName: 'Times Square Electronics',
      price: '$349',
      inStock: true,
      productsAvailable: 23,
      distance: '0.3 mi'
    },
    {
      id: '2',
      position: { lat: 40.7489, lng: -73.9680 },
      title: 'Grand Central Tech',
      storeName: 'Grand Central Tech',
      price: '$359',
      inStock: true,
      productsAvailable: 15,
      distance: '0.8 mi'
    },
    {
      id: '3',
      position: { lat: 40.7614, lng: -73.9776 },
      title: 'Central Park Gadgets',
      storeName: 'Central Park Gadgets',
      price: '$345',
      inStock: false,
      productsAvailable: 8,
      distance: '1.2 mi'
    }
  ];

  const [selectedStore, setSelectedStore] = useState(mockStores[0]);

  const mapCenter = latitude && longitude 
    ? { lat: latitude, lng: longitude }
    : { lat: 40.7580, lng: -73.9855 }; // Default to NYC

  const handleMarkerClick = (marker: any) => {
    const store = mockStores.find(s => s.title === marker.title);
    if (store) {
      setSelectedStore(store);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-16">
      {/* Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="flex items-center gap-2 bg-background rounded-lg shadow-lg p-2">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <Input
            placeholder="Search on map..."
            className="border-0 shadow-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button size="icon" variant="ghost">
            <MapPin className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="flex items-center justify-center h-full bg-muted">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Getting your location...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full bg-muted">
            <div className="text-center p-6">
              <p className="text-destructive font-semibold mb-2">Location Error</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <p className="text-xs text-muted-foreground mt-2">Showing default location</p>
            </div>
          </div>
        ) : null}
        
        <GoogleMap
          center={mapCenter}
          zoom={14}
          markers={mockStores}
          onMarkerClick={handleMarkerClick}
        />
      </div>

      {/* Store Info Card */}
      {selectedStore && (
        <div className="absolute bottom-20 left-4 right-4 z-10">
          <div className="bg-card rounded-lg shadow-lg p-4 border border-border">
            <h3 className="font-semibold mb-1">{selectedStore.storeName}</h3>
            <p className="text-sm text-muted-foreground mb-2">
              {selectedStore.productsAvailable} products available
            </p>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg font-semibold text-primary">{selectedStore.price}</span>
              <span className={`text-sm ${selectedStore.inStock ? 'text-green-600' : 'text-red-600'}`}>
                {selectedStore.inStock ? '✓ In Stock' : '✗ Out of Stock'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-primary">{selectedStore.distance} away</span>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => navigate(`/store/${selectedStore.id}`)}
                >
                  View Store
                </Button>
                <Button size="sm">
                  Directions
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default MapView;
