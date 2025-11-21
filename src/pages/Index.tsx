import { useState } from 'react';
import { Search, ScanBarcode, TrendingUp, MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BottomNav from '@/components/BottomNav';
import { useStores } from '@/hooks/useStores';
import { useGeolocation } from '@/hooks/useGeolocation';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { stores } = useStores();
  const { latitude, longitude } = useGeolocation();

  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const trendingSearches = ['Wireless Headphones', 'Running Shoes', 'Coffee Maker', 'Laptop', 'Phone Case'];
  const featuredStores = stores.slice(0, 3);

  return (
    <div className="flex flex-col min-h-screen pb-16">
      {/* Header */}
      <header className="p-4 bg-primary text-primary-foreground">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">AassPass</h1>
            <Button variant="ghost" size="sm" className="text-primary-foreground">
              <MapPin className="w-4 h-4 mr-2" />
              {latitude && longitude ? 'Location Set' : 'Enable Location'}
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <div className="flex items-center gap-2 p-3 bg-background rounded-lg shadow-lg">
              <Search className="w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search for products..."
                className="border-0 shadow-none flex-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(searchQuery);
                  }
                }}
              />
              <Link to="/scanner">
                <Button size="icon" variant="ghost">
                  <ScanBarcode className="w-5 h-5" />
                </Button>
              </Link>
            </div>
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
              {trendingSearches.map((term) => (
                <Button
                  key={term}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSearch(term)}
                >
                  {term}
                </Button>
              ))}
            </div>
          </div>

          {/* Featured Stores */}
          <div>
            <h2 className="font-semibold mb-3">Featured Stores Near You</h2>
            {featuredStores.length > 0 ? (
              <div className="space-y-3">
                {featuredStores.map((store) => (
                  <Link key={store.id} to={`/store/${store.id}`}>
                    <div className="p-4 bg-card border border-border rounded-lg hover:border-primary transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{store.name}</h3>
                        {store.rating && (
                          <span className="text-sm">⭐ {store.rating.toFixed(1)}</span>
                        )}
                      </div>
                      {store.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {store.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{store.address}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 bg-card border border-border rounded-lg text-center">
                <p className="text-muted-foreground">No stores available yet</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
