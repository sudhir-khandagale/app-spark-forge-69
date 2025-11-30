import { useState, useEffect } from 'react';
import { Search, MapPin, Store as StoreIcon, Star, TrendingUp } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RoleBasedBottomNav from '@/components/RoleBasedBottomNav';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useStores } from '@/hooks/useStores';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';
import FlashSaleBadge from '@/components/FlashSaleBadge';
import { useFlashSales } from '@/hooks/useFlashSales';
import flowduxIcon from '@/assets/flowdux-icon.png';
import { PullToRefresh } from '@/components/PullToRefresh';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import { VoiceSearchButton } from '@/components/VoiceSearchButton';

interface TrendingProduct {
  id: string;
  name: string;
  image_url: string | null;
  category: string | null;
  rating: number | null;
  review_count: number | null;
  store_name: string;
  store_id: string;
  price: number;
  in_stock: boolean;
}

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingProducts, setTrendingProducts] = useState<TrendingProduct[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const navigate = useNavigate();
  const { latitude, longitude } = useGeolocation();
  const { stores, loading } = useStores();
  const { t } = useTranslation();
  
  // Only fetch flash sales after products are loaded
  const productIds = trendingProducts.map(p => p.id);
  const { getFlashSale } = useFlashSales(productIds.length > 0 ? productIds : undefined);

  useEffect(() => {
    fetchTrendingProducts();
  }, []);

  const fetchTrendingProducts = async (): Promise<void> => {
    try {
      setLoadingTrending(true);

      // Fetch inventory with products and stores (no nested filters)
      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory')
        .select(`
          product_id,
          price,
          in_stock,
          store_id,
          products (
            id,
            name,
            image_url,
            category,
            rating,
            review_count,
            trending
          ),
          stores (
            id,
            name,
            status
          )
        `)
        .eq('in_stock', true)
        .limit(50);

      if (inventoryError) {
        console.error('Query error:', inventoryError);
        throw inventoryError;
      }

      // Client-side filter for trending products in approved stores
      const filtered = inventory?.filter((inv: any) => 
        inv.products?.trending === true && 
        inv.stores?.status === 'approved'
      ) || [];

      // Map unique products (take first store for each product)
      const productMap = new Map<string, TrendingProduct>();
      
      filtered.forEach((inv: any) => {
        const product = inv.products;
        if (product && !productMap.has(product.id)) {
          productMap.set(product.id, {
            id: product.id,
            name: product.name,
            image_url: product.image_url,
            category: product.category,
            rating: product.rating,
            review_count: product.review_count,
            store_name: inv.stores.name,
            store_id: inv.store_id,
            price: inv.price,
            in_stock: inv.in_stock
          });
        }
      });

      const products = Array.from(productMap.values()).slice(0, 4);
      setTrendingProducts(products);

      if (products.length === 0) {
        console.log('No trending products found in approved stores');
      }
    } catch (error: any) {
      console.error('Error fetching trending products:', error);
      toast({
        title: 'Unable to load products',
        description: 'Please refresh the page or try again later',
        variant: 'destructive',
      });
      setTrendingProducts([]);
    } finally {
      setLoadingTrending(false);
    }
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };
  
  const featuredStores = stores.filter(store => (store as any).featured).slice(0, 5);

  return (
    <div className="flex flex-col min-h-screen pb-16">
      {/* Header - extends to top with safe area */}
      <header className="bg-gradient-primary -mt-[env(safe-area-inset-top)] pt-[calc(env(safe-area-inset-top)+1rem)] px-4 pb-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <img src={flowduxIcon} alt="Flowdux Logo" className="h-10 rounded-xl shadow-lg" />
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <MapPin className="w-4 h-4 mr-2" />
              {latitude && longitude ? t('location_required').split(' ')[0] : t('enable_location')}
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <div className="flex items-center gap-2 p-3 bg-background rounded-lg shadow-lg">
              <Search className="w-5 h-5 text-muted-foreground" />
              <Input
                placeholder={t('search_products')}
                className="border-0 shadow-none flex-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(searchQuery);
                  }
                }}
              />
              <VoiceSearchButton 
                onTranscript={setSearchQuery} 
                className="shrink-0"
              />
              <Button 
                size="icon" 
                variant="secondary"
                onClick={() => handleSearch(searchQuery)}
                type="button"
                className="bg-accent hover:bg-accent/90"
              >
                <Search className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <PullToRefresh onRefresh={fetchTrendingProducts}>
        {/* Content */}
        <main className="flex-1 p-4">
          <div className="max-w-lg mx-auto space-y-6">
          {/* Trending Products Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">{t('trending_products')}</h2>
            </div>
            {loadingTrending ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-3">
                      <Skeleton className="h-32 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4 mb-1" />
                      <Skeleton className="h-3 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : trendingProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {trendingProducts.slice(0, 4).map((product) => {
                  const flashSale = getFlashSale(product.id);
                  
                  return (
                    <Link key={product.id} to={`/product/${product.id}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                        <CardContent className="p-3">
                          {product.image_url ? (
                            <div className="aspect-square w-full overflow-hidden rounded-md mb-2">
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="aspect-square w-full bg-muted rounded-md mb-2 flex items-center justify-center">
                              <StoreIcon className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                          <h3 className="font-medium text-sm line-clamp-2 mb-1">{product.name}</h3>
                          {product.rating !== null && product.rating > 0 && (
                            <div className="flex items-center gap-1 mb-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs">{product.rating.toFixed(1)}</span>
                              {product.review_count !== null && product.review_count > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  ({product.review_count})
                                </span>
                              )}
                            </div>
                          )}
                          {flashSale ? (
                            <FlashSaleBadge
                              originalPrice={flashSale.original_price}
                              salePrice={flashSale.sale_price}
                              discountPercentage={flashSale.discount_percentage}
                              endsAt={flashSale.ends_at}
                              size="sm"
                              showTimer={false}
                            />
                          ) : (
                            <p className="text-sm font-semibold text-primary">
                              {formatPrice(product.price)}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  {t('no_results')}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Featured Stores Carousel */}
          {!loading && featuredStores.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <StoreIcon className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">{t('featured_stores')}</h2>
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
                                {store.rating !== null && store.rating > 0 && (
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
      </PullToRefresh>

      <RoleBasedBottomNav />
    </div>
  );
};

export default Index;
