import { ArrowLeft, Share2, MapPin, Phone, Navigation, Loader2, ShoppingCart, Scale, Map } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/BottomNav';
import WishlistButton from '@/components/WishlistButton';
import { useProduct } from '@/hooks/useProducts';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ProductReviewForm from '@/components/ProductReviewForm';
import ProductReviews from '@/components/ProductReviews';
import { formatPrice } from '@/lib/utils';

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get('store');
  const { product, loading } = useProduct(id!, storeId || undefined);
  const { toast } = useToast();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [reviewRefresh, setReviewRefresh] = useState(0);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    if (product?.store_latitude && product?.store_longitude && mapRef.current && !googleMapRef.current) {
      initializeMap();
    }
  }, [product]);

  const initializeMap = async () => {
    try {
      // Load Google Maps script
      if (!window.google) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`;
        script.async = true;
        document.head.appendChild(script);
        
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      if (!mapRef.current || !product || !window.google) return;

      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: product.store_latitude!, lng: product.store_longitude! },
        zoom: 15,
      });

      new window.google.maps.Marker({
        position: { lat: product.store_latitude!, lng: product.store_longitude! },
        map: map,
        title: product.store_name,
      });

      googleMapRef.current = map;
    } catch (error) {
      console.error('Error loading map:', error);
    }
  };

  const handleAddToCart = async () => {
    try {
      setIsAddingToCart(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please login to add to cart',
          variant: 'destructive',
        });
        return;
      }

      // Get or create cart
      let { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!cart) {
        const { data: newCart, error: cartError } = await supabase
          .from('carts')
          .insert({ user_id: user.id })
          .select('id')
          .single();
        
        if (cartError) throw cartError;
        cart = newCart;
      }

      // Add to cart
      const { error } = await supabase
        .from('cart_items')
        .upsert({
          cart_id: cart.id,
          product_id: id!,
          store_id: product!.store_id!,
          price: product!.price,
          quantity: 1,
        }, {
          onConflict: 'cart_id,product_id,store_id',
        });

      if (error) throw error;

      toast({
        title: 'Added to cart',
        description: `${product?.name} added to your cart`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleGetDirections = () => {
    if (product?.store_latitude && product?.store_longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${product.store_latitude},${product.store_longitude}`;
      window.open(url, '_blank');
    }
  };

  const handleOpenInMaps = () => {
    if (product?.store_latitude && product?.store_longitude) {
      // Use coordinates if available
      const url = `https://www.google.com/maps/search/?api=1&query=${product.store_latitude},${product.store_longitude}`;
      window.open(url, '_blank');
    } else if (product?.store_address) {
      // Fall back to searching by address
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(product.store_address)}`;
      window.open(url, '_blank');
    } else if (product?.store_name) {
      // Last resort: search by store name
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(product.store_name)}`;
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen pb-16">
        <header className="sticky top-0 z-40 bg-background border-b border-border">
          <div className="flex items-center justify-between p-4">
            <Link to="/search">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon">
              <Share2 className="w-5 h-5" />
            </Button>
            <WishlistButton productId={id!} />
          </div>
          </div>
        </header>

        <main className="flex-1 p-4">
          <div className="max-w-lg mx-auto space-y-4">
            <Skeleton className="w-full h-64 rounded-lg" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col min-h-screen pb-16">
        <header className="sticky top-0 z-40 bg-background border-b border-border">
          <div className="flex items-center justify-between p-4">
            <Link to="/search">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </header>
        <main className="flex-1 p-4 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Product not found</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-16">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Link to="/search">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon">
              <Share2 className="w-5 h-5" />
            </Button>
            <WishlistButton productId={id!} />
          </div>
        </div>
      </header>

      {/* Product Image */}
      <div className="w-full h-64 bg-muted flex items-center justify-center">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-muted-foreground">No image available</div>
        )}
      </div>

      {/* Product Info */}
      <main className="flex-1 p-4">
        <div className="max-w-lg mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
            {product.description && (
              <p className="text-muted-foreground">{product.description}</p>
            )}
            {product.category && (
              <p className="text-sm text-muted-foreground mt-2">Category: {product.category}</p>
            )}
          </div>

          {/* Compare Prices Button */}
          <Link to={`/compare/${id}`}>
            <Button variant="outline" className="w-full" size="lg">
              <Scale className="w-4 h-4 mr-2" />
              Compare Prices Across Stores
            </Button>
          </Link>

          {/* Store Availability */}
          {product.store_name && (
            <div className="space-y-3">
              <h2 className="font-semibold text-lg">Available At</h2>
              <div className="p-4 bg-card border border-border rounded-lg space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{product.store_name}</h3>
                    {product.store_address && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {product.store_address}
                      </p>
                    )}
                    {product.store_rating && (
                      <p className="text-sm text-muted-foreground mt-1">
                        ⭐ {product.store_rating.toFixed(1)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary">{formatPrice(product.price)}</span>
                    <p className={`text-sm font-medium mt-1 ${product.in_stock ? 'text-accent' : 'text-destructive'}`}>
                      {product.in_stock ? `In Stock (${product.quantity})` : 'Out of Stock'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    {product.in_stock && (
                      <Button 
                        className="flex-1"
                        onClick={handleAddToCart}
                        disabled={isAddingToCart}
                      >
                        {isAddingToCart ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <ShoppingCart className="w-4 h-4 mr-2" />
                        )}
                        Add to Cart
                      </Button>
                    )}
                    <Button 
                      variant="outline"
                      className={product.in_stock ? "flex-1" : "w-full"}
                      onClick={handleOpenInMaps}
                    >
                      <Map className="w-4 h-4 mr-2" />
                      Open in Maps
                    </Button>
                  </div>
                  <Link to={`/store/${product.store_id}`}>
                    <Button variant="outline" className="w-full">View Store</Button>
                  </Link>
                </div>

                {product.store_latitude && product.store_longitude && (
                  <>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleGetDirections}
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Get Directions
                    </Button>

                    <div className="mt-4">
                      <h3 className="font-semibold mb-2">Store Location</h3>
                      <div ref={mapRef} className="w-full h-64 rounded-lg border" />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Product Reviews */}
          <div className="space-y-3">
            <ProductReviews 
              productId={id!} 
              refreshTrigger={reviewRefresh}
            />
            {storeId && (
              <ProductReviewForm 
                productId={id!}
                storeId={storeId}
                onReviewSubmitted={() => setReviewRefresh(prev => prev + 1)}
              />
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default ProductDetails;
