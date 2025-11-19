import { Search, ScanBarcode, TrendingUp, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BottomNav from '@/components/BottomNav';

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen pb-16">
      {/* Header */}
      <header className="p-4 bg-primary text-primary-foreground">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">AassPass</h1>
            <Button variant="ghost" size="sm" className="text-primary-foreground">
              <MapPin className="w-4 h-4 mr-2" />
              Change Location
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Link to="/search">
              <div className="flex items-center gap-2 p-3 bg-background rounded-lg shadow-lg">
                <Search className="w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search for products..."
                  className="border-0 shadow-none flex-1 cursor-pointer"
                  readOnly
                />
              </div>
            </Link>
            <Link to="/scanner">
              <Button
                size="icon"
                className="absolute right-2 top-2"
              >
                <ScanBarcode className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Popular Searches */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Trending Searches</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Wireless Headphones', 'Running Shoes', 'Coffee Maker', 'Laptop', 'Phone Case'].map(
                (term) => (
                  <Link key={term} to="/search">
                    <Button variant="outline" size="sm">
                      {term}
                    </Button>
                  </Link>
                )
              )}
            </div>
          </div>

          {/* Featured Stores */}
          <div>
            <h2 className="font-semibold mb-3">Featured Stores</h2>
            <div className="space-y-3">
              {[
                { name: 'Tech Store Downtown', distance: '0.5 mi', products: 150 },
                { name: 'Sports & Outdoors', distance: '1.2 mi', products: 230 },
                { name: 'Home Essentials', distance: '0.8 mi', products: 180 },
              ].map((store, i) => (
                <Link key={i} to={`/store/${i + 1}`}>
                  <div className="p-4 bg-card border border-border rounded-lg">
                    <h3 className="font-semibold mb-1">{store.name}</h3>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {store.products} products
                      </span>
                      <span className="text-primary">{store.distance}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Searches */}
          <div>
            <h2 className="font-semibold mb-3">Recent Searches</h2>
            <div className="space-y-2">
              {['Bluetooth Speaker', 'Yoga Mat'].map((term, i) => (
                <Link key={i} to="/search">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                  >
                    <Search className="w-4 h-4 mr-3 text-muted-foreground" />
                    {term}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
