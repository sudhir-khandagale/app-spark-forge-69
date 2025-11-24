import { useState } from 'react';
import { Search, MapPin, Store as StoreIcon, Star } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BottomNav from '@/components/BottomNav';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useStores } from '@/hooks/useStores';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { latitude, longitude } = useGeolocation();
  const { stores, loading } = useStores();

  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };
  
  // Get featured stores to showcase
  const featuredStores = stores.filter(store => (store as any).featured).slice(0, 5);

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
          {/* Featured Stores Carousel */}
          {!loading && featuredStores.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <StoreIcon className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">Featured Stores</h2>
              </div>
              <Carousel className="w-full">
                <CarouselContent>
                  {featuredStores.map((store) => (
                    <CarouselItem key={store.id}>
                      <Link to={`/store/${store.id}`}>
                        <Card className="border-2 hover:border-primary transition-colors">
                          <CardContent className="p-0">
                            {store.photo_urls && store.photo_urls.length > 0 ? (
                              <div className="relative h-40 w-full">
                                <img
                                  src={store.photo_urls[0]}
                                  alt={store.name}
                                  className="w-full h-full object-cover rounded-t-lg"
                                />
                                <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded-full">
                                  FEATURED
                                </div>
                              </div>
                            ) : (
                              <div className="relative h-40 w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center rounded-t-lg">
                                <StoreIcon className="w-16 h-16 text-primary/40" />
                                <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded-full">
                                  FEATURED
                                </div>
                              </div>
                            )}
                            <div className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-semibold text-lg line-clamp-1">{store.name}</h3>
                                {store.rating && (
                                  <div className="flex items-center gap-1 text-sm">
                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    <span className="font-medium">{store.rating.toFixed(1)}</span>
                                  </div>
                                )}
                              </div>
                              {store.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                  {store.description}
                                </p>
                              )}
                              {store.specialties && store.specialties.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {store.specialties.slice(0, 3).map((specialty, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full"
                                    >
                                      {specialty}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                📍 {store.address}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </Carousel>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
