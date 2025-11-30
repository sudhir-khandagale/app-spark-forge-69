import { useState, useEffect } from 'react';
import { MapPin, Navigation, ShoppingCart, Store, TrendingUp, Loader2, Star } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/BackButton';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import RoleBasedBottomNav from '@/components/RoleBasedBottomNav';
import WishlistButton from '@/components/WishlistButton';
import FavoriteStoreButton from '@/components/FavoriteStoreButton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useFavoriteStores } from '@/hooks/useFavoriteStores';
import { formatPrice } from '@/lib/utils';

interface StoreInventory {
  id: string;
  price: number;
  quantity: number;
  in_stock: boolean;
  store: {
    id: string;
    name: string;
    address: string;
    rating: number | null;
    latitude: number | null;
    longitude: number | null;
  };
  distance?: number;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  rating: number | null;
}

const Compare = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [inventory, setInventory] = useState<StoreInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'price' | 'distance' | 'rating' | 'favorite'>('favorite');
  const { latitude, longitude } = useGeolocation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { favoriteStoreIds, isFavorite } = useFavoriteStores();

  useEffect(() => {
    fetchProductAndInventory();
  }, [id, latitude, longitude]);

  useEffect(() => {
    if (inventory.length > 0) {
      sortInventory();
    }
  }, [sortBy]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchProductAndInventory = async () => {
    try {
      setLoading(true);

      // Fetch product details
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('id, name, description, category, image_url, rating')
        .eq('id', id!)
        .single();

      if (productError) throw productError;
      setProduct(productData);

      // Fetch all inventory for this product
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select(`
          id,
          price,
          quantity,
          in_stock,
          store_id,
          stores (
            id,
            name,
            address,
            rating,
            latitude,
            longitude,
            status
          )
        `)
        .eq('product_id', id!)
        .eq('in_stock', true);

      if (inventoryError) throw inventoryError;

      // Format and calculate distances
      const formattedInventory = inventoryData
        ?.filter(item => (item.stores as any)?.status === 'approved')
        .map(item => {
          const store = item.stores as any;
          let distance: number | undefined;

          if (latitude && longitude && store.latitude && store.longitude) {
            distance = calculateDistance(latitude, longitude, store.latitude, store.longitude);
          }

          return {
            id: item.id,
            price: item.price,
            quantity: item.quantity,
            in_stock: item.in_stock,
            store: {
              id: store.id,
              name: store.name,
              address: store.address,
              rating: store.rating,
              latitude: store.latitude,
              longitude: store.longitude,
            },
            distance,
          };
        }) || [];

      setInventory(formattedInventory);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load comparison data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sortInventory = () => {
    const sorted = [...inventory].sort((a, b) => {
      // Always prioritize favorite stores first
      const aIsFavorite = isFavorite(a.store.id);
      const bIsFavorite = isFavorite(b.store.id);
      
      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;
      
      // Then sort by selected criteria
      switch (sortBy) {
        case 'favorite':
          return 0; // Already sorted by favorite above
        case 'price':
          return a.price - b.price;
        case 'distance':
          if (!a.distance) return 1;
          if (!b.distance) return -1;
          return a.distance - b.distance;
        case 'rating':
          return (b.store.rating || 0) - (a.store.rating || 0);
        default:
          return 0;
      }
    });
    setInventory(sorted);
  };

  const addToCart = async (inventoryId: string, storeId: string, price: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Login Required',
          description: 'Please login to add items to cart',
        });
        navigate('/auth');
        return;
      }

      // Get or create cart
      let { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!cart) {
        const { data: newCart } = await supabase
          .from('carts')
          .insert({ user_id: user.id })
          .select('id')
          .single();
        cart = newCart;
      }

      if (!cart) throw new Error('Failed to create cart');

      // Add to cart
      const { error } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cart.id,
          product_id: id!,
          store_id: storeId,
          quantity: 1,
          price: price,
        });

      if (error) throw error;

      toast({
        title: 'Added to cart',
        description: `${product?.name} added to your cart`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add to cart',
        variant: 'destructive',
      });
    }
  };

  const getDirections = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen pb-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col min-h-screen pb-16">
        <header className="sticky top-0 z-10 bg-background border-b border-border">
          <div className="flex items-center gap-4 p-4 max-w-4xl mx-auto">
            <BackButton fallbackPath="/" />
            <h1 className="text-xl font-bold">Product Not Found</h1>
          </div>
        </header>
        <main className="flex-1 p-4 flex items-center justify-center">
          <p className="text-muted-foreground">Product not found</p>
        </main>
      </div>
    );
  }

  const lowestPrice = inventory.length > 0 ? Math.min(...inventory.map(i => i.price)) : 0;
  const highestPrice = inventory.length > 0 ? Math.max(...inventory.map(i => i.price)) : 0;
  const avgPrice = inventory.length > 0 ? inventory.reduce((sum, i) => sum + i.price, 0) / inventory.length : 0;

  return (
    <div className="flex flex-col min-h-screen pb-16">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <BackButton fallbackPath={`/product/${id}`} />
            <h1 className="text-xl font-bold">Compare Prices</h1>
          </div>
          <WishlistButton productId={id!} />
        </div>
      </header>

      {/* Product Info */}
      <div className="bg-muted/30 border-b border-border">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex gap-4">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-20 h-20 object-cover rounded-lg"
              />
            ) : (
              <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                <Store className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-lg font-bold mb-1">{product.name}</h2>
              {product.category && (
                <p className="text-sm text-muted-foreground mb-1">{product.category}</p>
              )}
              {product.rating !== null && product.rating > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-sm">⭐</span>
                  <span className="text-sm font-medium">{product.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Price Summary */}
          {inventory.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              <Card className="p-3">
                <p className="text-xs text-muted-foreground mb-1">Lowest Price</p>
                <p className="text-lg font-bold text-primary">{formatPrice(lowestPrice)}</p>
              </Card>
              <Card className="p-3">
                <p className="text-xs text-muted-foreground mb-1">Average Price</p>
                <p className="text-lg font-bold">{formatPrice(avgPrice)}</p>
              </Card>
              <Card className="p-3">
                <p className="text-xs text-muted-foreground mb-1">Highest Price</p>
                <p className="text-lg font-bold">{formatPrice(highestPrice)}</p>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Sort Options */}
      <div className="border-b border-border bg-background">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Sort by:</span>
            <Button
              variant={sortBy === 'favorite' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('favorite')}
            >
              <Star className="w-4 h-4 mr-2" />
              Favorites
            </Button>
            <Button
              variant={sortBy === 'price' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('price')}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Price
            </Button>
            <Button
              variant={sortBy === 'distance' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('distance')}
              disabled={!latitude || !longitude}
            >
              <MapPin className="w-4 h-4 mr-2" />
              Distance
            </Button>
            <Button
              variant={sortBy === 'rating' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('rating')}
            >
              ⭐ Rating
            </Button>
          </div>
        </div>
      </div>

      {/* Comparison List */}
      <main className="flex-1 p-4">
        <div className="max-w-4xl mx-auto space-y-3">
          {inventory.length === 0 ? (
            <Card className="p-8 text-center">
              <Store className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No stores found</h3>
              <p className="text-muted-foreground">
                This product is currently not available at any stores
              </p>
            </Card>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Comparing prices from {inventory.length} store{inventory.length > 1 ? 's' : ''}
              </p>
              {inventory.map((item, index) => (
                <Card key={item.id} className="p-4 relative">
                  {isFavorite(item.store.id) && (
                    <Badge className="absolute top-2 left-2 bg-yellow-500">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      Favorite Store
                    </Badge>
                  )}
                  {item.price === lowestPrice && (
                    <Badge className="absolute top-2 right-2 bg-accent">
                      Best Price
                    </Badge>
                  )}

                  <div className="space-y-3">
                    {/* Store Info */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Link to={`/store/${item.store.id}`}>
                            <h3 className="font-semibold text-lg hover:text-primary">
                              {item.store.name}
                            </h3>
                          </Link>
                          <FavoriteStoreButton storeId={item.store.id} size="sm" />
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {item.store.address}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          {item.store.rating !== null && item.store.rating > 0 && (
                            <span className="text-sm">⭐ {item.store.rating.toFixed(1)}</span>
                          )}
                          {item.distance && (
                            <span className="text-sm text-muted-foreground">
                              {item.distance.toFixed(1)} mi away
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Price & Stock */}
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary mb-1">
                          {formatPrice(item.price)}
                        </p>
                        <p className="text-sm font-medium text-accent">
                          In Stock ({item.quantity})
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => addToCart(item.id, item.store.id, item.price)}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                      </Button>
                      {item.store.latitude && item.store.longitude && (
                        <Button
                          variant="outline"
                          onClick={() => getDirections(item.store.latitude!, item.store.longitude!)}
                        >
                          <Navigation className="w-4 h-4 mr-2" />
                          Directions
                        </Button>
                      )}
                      <Link to={`/product/${id}?store=${item.store.id}`}>
                        <Button variant="outline">View</Button>
                      </Link>
                    </div>

                    {/* Savings Indicator */}
                    {item.price > lowestPrice && (
                      <p className="text-xs text-muted-foreground text-center">
                        {formatPrice(item.price - lowestPrice)} more than lowest price
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </>
          )}
        </div>
      </main>

      <RoleBasedBottomNav />
    </div>
  );
};

export default Compare;
