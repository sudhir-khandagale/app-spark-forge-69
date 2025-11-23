import { ArrowLeft, Heart, Phone, Navigation, Clock, Loader2, MapPin } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/BottomNav';
import { useStore, useStoreInventory } from '@/hooks/useStores';
import { Skeleton } from '@/components/ui/skeleton';

const StoreProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { store, loading: storeLoading } = useStore(id!);
  const { inventory, loading: inventoryLoading } = useStoreInventory(id!);

  const handleGetDirections = () => {
    if (store?.latitude && store?.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`;
      window.open(url, '_blank');
    }
  };

  const handleCall = () => {
    if (store?.phone) {
      window.location.href = `tel:${store.phone}`;
    }
  };

  if (storeLoading) {
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
        <main className="flex-1 p-4">
          <div className="max-w-lg mx-auto space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!store) {
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
            <p className="text-muted-foreground">Store not found</p>
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
          <Button variant="ghost" size="icon">
            <Heart className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Store Header */}
      <div className="p-4 bg-card border-b border-border">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold mb-2">{store.name}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <span>⭐ {store.rating?.toFixed(1) || 'No rating'}</span>
            <span>({store.review_count || 0} reviews)</span>
          </div>

          {store.description && (
            <p className="text-muted-foreground mb-4">{store.description}</p>
          )}

          {store.specialties && store.specialties.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {store.specialties.map((specialty, i) => (
                <span key={i} className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">
                  {specialty}
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            {store.latitude && store.longitude && (
              <Button onClick={handleGetDirections} className="flex-1">
                <Navigation className="w-4 h-4 mr-2" />
                Get Directions
              </Button>
            )}
            {store.phone && (
              <Button onClick={handleCall} variant="outline" className="flex-1">
                <Phone className="w-4 h-4 mr-2" />
                Call
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Store Details */}
      <main className="flex-1 p-4">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Contact & Location */}
          <div className="space-y-2">
            <h2 className="font-semibold">Contact & Location</h2>
            <div className="p-4 bg-card border border-border rounded-lg space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                <span className="text-sm">{store.address}</span>
              </div>
              {store.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{store.phone}</span>
                </div>
              )}
              {store.email && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">✉</span>
                  <span className="text-sm">{store.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Hours */}
          {store.hours && (
            <div className="space-y-2">
              <h2 className="font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Hours
              </h2>
              <div className="p-4 bg-card border border-border rounded-lg">
                {Object.entries(store.hours as Record<string, any>).map(([day, hours]) => {
                  const hoursText = typeof hours === 'string' 
                    ? hours 
                    : hours?.open && hours?.close 
                      ? `${hours.open} - ${hours.close}` 
                      : 'Closed';
                  
                  return (
                    <div key={day} className="flex justify-between text-sm py-1">
                      <span className="capitalize">{day}</span>
                      <span className="text-muted-foreground">{hoursText}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Available Products */}
          <div className="space-y-2">
            <h2 className="font-semibold">Available Products</h2>
            {inventoryLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : inventory.length > 0 ? (
              <div className="space-y-2">
                {inventory.map((item) => {
                  const product = item.products as any;
                  return (
                    <Link key={item.id} to={`/product/${product.id}?store=${store.id}`}>
                      <div className="p-4 bg-card border border-border rounded-lg hover:border-primary transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold">{product.name}</h3>
                            {product.category && (
                              <p className="text-xs text-muted-foreground mt-1">{product.category}</p>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <span className="text-lg font-bold text-primary">${item.price.toFixed(2)}</span>
                            <p className={`text-xs font-medium mt-1 ${item.in_stock ? 'text-accent' : 'text-destructive'}`}>
                              {item.in_stock ? `${item.quantity} in stock` : 'Out of stock'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 bg-card border border-border rounded-lg text-center">
                <p className="text-muted-foreground">No products available</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default StoreProfile;
