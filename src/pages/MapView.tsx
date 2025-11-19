import { ArrowLeft, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BottomNav from '@/components/BottomNav';

const MapView = () => {
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
          />
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="flex-1 bg-muted flex items-center justify-center">
        <div className="text-center p-8">
          <Navigation className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h3 className="font-semibold mb-2">Map View</h3>
          <p className="text-sm text-muted-foreground">
            Map integration will show stores with inventory here
          </p>
        </div>
      </div>

      {/* Store Info Card */}
      <div className="absolute bottom-20 left-4 right-4">
        <Link to="/store/1">
          <div className="bg-card rounded-lg shadow-lg p-4 border border-border">
            <h3 className="font-semibold mb-1">Tech Store Downtown</h3>
            <p className="text-sm text-muted-foreground mb-2">
              15 products available
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-primary">0.5 mi away</span>
              <Button size="sm">View Store</Button>
            </div>
          </div>
        </Link>
      </div>

      <BottomNav />
    </div>
  );
};

export default MapView;
