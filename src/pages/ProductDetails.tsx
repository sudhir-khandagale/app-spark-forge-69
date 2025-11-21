import { ArrowLeft, Share2, Heart, MapPin, Phone, Navigation, Loader2 } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/BottomNav';
import { useProduct } from '@/hooks/useProducts';
import { Skeleton } from '@/components/ui/skeleton';

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get('store');
  const { product, loading } = useProduct(id!, storeId || undefined);

  const handleGetDirections = () => {
    if (product?.store_latitude && product?.store_longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${product.store_latitude},${product.store_longitude}`;
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
              <Button variant="ghost" size="icon">
                <Heart className="w-5 h-5" />
              </Button>
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
            <Button variant="ghost" size="icon">
              <Heart className="w-5 h-5" />
            </Button>
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
                    <span className="text-2xl font-bold text-primary">${product.price.toFixed(2)}</span>
                    <p className={`text-sm font-medium mt-1 ${product.in_stock ? 'text-accent' : 'text-destructive'}`}>
                      {product.in_stock ? `In Stock (${product.quantity})` : 'Out of Stock'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {product.in_stock && (
                    <Link to={`/reserve/${product.id}?store=${product.store_id}`} className="flex-1">
                      <Button className="w-full">Reserve Item</Button>
                    </Link>
                  )}
                  <Link to={`/store/${product.store_id}`} className="flex-1">
                    <Button variant="outline" className="w-full">View Store</Button>
                  </Link>
                </div>

                {product.store_latitude && product.store_longitude && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleGetDirections}
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Get Directions
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default ProductDetails;
