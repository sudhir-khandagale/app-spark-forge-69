import { useState, useEffect } from 'react';
import { ArrowLeft, SlidersHorizontal, Loader2, Scale, Star } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import BottomNav from '@/components/BottomNav';
import WishlistButton from '@/components/WishlistButton';
import FavoriteStoreButton from '@/components/FavoriteStoreButton';
import { useProductSearch } from '@/hooks/useProducts';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useFavoriteStores } from '@/hooks/useFavoriteStores';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const { results, loading, searchProducts } = useProductSearch();
  const { latitude, longitude } = useGeolocation();
  const { isFavorite } = useFavoriteStores();

  // Sort results to prioritize favorite stores
  const sortedResults = [...results].sort((a, b) => {
    const aIsFavorite = isFavorite(a.store_id);
    const bIsFavorite = isFavorite(b.store_id);
    
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    
    // Then sort by distance if available
    if (a.distance && b.distance) {
      return a.distance - b.distance;
    }
    return 0;
  });

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      searchProducts(q, latitude || undefined, longitude || undefined);
    }
  }, [searchParams, latitude, longitude]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query });
      searchProducts(query, latitude || undefined, longitude || undefined);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-16">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <form onSubmit={handleSearch} className="flex items-center gap-3 p-4">
          <Link to="/">
            <Button variant="ghost" size="icon" type="button">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <Input
            placeholder="Search for products..."
            className="flex-1"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button variant="ghost" size="icon" type="button">
            <SlidersHorizontal className="w-5 h-5" />
          </Button>
        </form>
      </header>

      {/* Results */}
      <main className="flex-1 p-4">
        <div className="max-w-lg mx-auto">
          {query && (
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-foreground">
                <span className="text-muted-foreground">Searching for:</span>{' '}
                <span className="font-semibold text-foreground">"{query}"</span>
              </p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : results.length > 0 ? (
            <>
              <p className="text-sm font-medium text-foreground mb-4">
                Found {results.length} {results.length === 1 ? 'result' : 'results'} near you
              </p>
              <div className="space-y-3">
                {sortedResults.map((result) => {
                  const isStoreFavorite = isFavorite(result.store_id);
                  return (
                    <div key={`${result.id}-${result.store_id}`} className="relative">
                      <Link to={`/product/${result.id}?store=${result.store_id}`}>
                        <div className="p-4 bg-background border-2 border-border rounded-lg hover:border-primary transition-colors shadow-sm hover:shadow-md">
                          {isStoreFavorite && (
                            <Badge className="absolute top-2 left-2 bg-yellow-500 text-xs">
                              <Star className="w-3 h-3 mr-1 fill-current" />
                              Favorite
                            </Badge>
                          )}
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-foreground text-base pr-20">{result.name}</h3>
                            <span className="text-primary font-bold text-base">${result.price.toFixed(2)}</span>
                          </div>
                          <p className="text-sm text-foreground/80 mb-2">
                            📍 {result.store_name}
                          </p>
                          <div className="flex items-center justify-between text-sm">
                            <span className={`font-medium px-2 py-1 rounded ${result.in_stock ? 'bg-accent/20 text-accent' : 'bg-destructive/20 text-destructive'}`}>
                              {result.in_stock ? `✓ In Stock (${result.quantity})` : '✗ Out of Stock'}
                            </span>
                            {result.distance && (
                              <span className="text-foreground/70 font-medium">
                                {result.distance.toFixed(1)} mi away
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                      <div className="absolute top-2 right-2 z-10 flex gap-1">
                        <FavoriteStoreButton storeId={result.store_id} size="sm" />
                        <WishlistButton productId={result.id} />
                        <Link to={`/compare/${result.id}`} onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" title="Compare prices">
                            <Scale className="w-5 h-5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : query ? (
            <div className="text-center py-12">
              <p className="text-foreground font-medium">No products found for "{query}"</p>
              <p className="text-sm text-muted-foreground mt-2">Try a different search term</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Search for products to see results</p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Search;
