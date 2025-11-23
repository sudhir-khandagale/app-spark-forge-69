import { useState } from 'react';
import { Search, TrendingUp, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BottomNav from '@/components/BottomNav';
import { useGeolocation } from '@/hooks/useGeolocation';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { latitude, longitude } = useGeolocation();

  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const trendingSearches = ['Wireless Headphones', 'Running Shoes', 'Coffee Maker', 'Laptop', 'Phone Case'];

  return (
    <div className="flex flex-col min-h-screen pb-16">
      {/* Header */}
      <header className="p-4 bg-primary text-primary-foreground">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Flowdux</h1>
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
              <Button 
                size="icon" 
                variant="ghost"
                onClick={() => handleSearch(searchQuery)}
                type="button"
              >
                <Search className="w-5 h-5 text-primary" />
              </Button>
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
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
