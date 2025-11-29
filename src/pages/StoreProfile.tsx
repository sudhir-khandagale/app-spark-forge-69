import { ArrowLeft, Phone, Navigation, Clock, Loader2, MapPin, Package, ShoppingBag } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/BottomNav';
import FavoriteStoreButton from '@/components/FavoriteStoreButton';
import { useStore, useStoreInventory } from '@/hooks/useStores';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserActivity } from '@/hooks/useUserActivity';
import { useEffect, useState } from 'react';
import { VendorProfileHeader } from '@/components/vendor/VendorProfileHeader';
import { VendorAchievements } from '@/components/vendor/VendorAchievements';
import { useVendorAchievements } from '@/hooks/useVendorAchievements';
import { useVendorFollowers } from '@/hooks/useVendorFollowers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VendorPostCard } from '@/components/vendor/VendorPostCard';
import { useVendorPosts } from '@/hooks/useVendorPosts';
import { useVendorStories } from '@/hooks/useVendorStories';
import VendorStoriesCarousel from '@/components/vendor/VendorStoriesCarousel';

const StoreProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { logActivity } = useUserActivity();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      logActivity('shop_visit', { storeId: id });
    }
    
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    fetchUser();
  }, [id]);
  
  const { store, loading: storeLoading } = useStore(id!);
  const { inventory, loading: inventoryLoading } = useStoreInventory(id!);
  const { achievements, loading: achievementsLoading } = useVendorAchievements((store as any)?.owner_id);
  const { followersCount, isFollowing, toggleFollow } = useVendorFollowers(id);
  const { posts, likePost } = useVendorPosts(id);
  const { stories, incrementViews } = useVendorStories(id);

  const isOwner = currentUserId === (store as any)?.owner_id;

  const handleGetDirections = () => {
    if ((store as any)?.google_maps_link) {
      window.open((store as any).google_maps_link, '_blank');
    } else if (store?.latitude && store?.longitude) {
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
        <header className="sticky top-0 z-40 bg-background border-b">
          <div className="flex items-center justify-between p-4">
            <Link to="/search">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </header>
        <main className="flex-1 p-4">
          <Skeleton className="h-48 w-full mb-4" />
          <Skeleton className="h-32 w-full" />
        </main>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex flex-col min-h-screen pb-16">
        <header className="sticky top-0 z-40 bg-background border-b">
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
    <div className="flex flex-col min-h-screen pb-16 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          <Link to="/search">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <FavoriteStoreButton storeId={id!} />
        </div>
      </header>

      {/* Profile Content */}
      <main className="flex-1">
        <div className="max-w-5xl mx-auto p-4 space-y-6">
          {/* Vendor Stories */}
          {stories.length > 0 && (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              <VendorStoriesCarousel
                stories={stories}
                vendorName={store.name}
                vendorAvatar={store.photo_urls?.[0]}
                onViewStory={incrementViews}
              />
            </div>
          )}

          {/* Vendor Profile Header */}
          <VendorProfileHeader
            store={{
              name: store.name,
              description: store.description || '',
              address: store.address,
              rating: store.rating || 0,
              review_count: store.review_count || 0,
              photo_urls: store.photo_urls || [],
              specialties: store.specialties || [],
            }}
            stats={{
              products: inventory.length,
              orders: 0,
              followers: followersCount,
            }}
            isOwner={isOwner}
            isFollowing={isFollowing}
            onFollow={() => toggleFollow((store as any).owner_id)}
          />

          {/* Achievements */}
          {!achievementsLoading && achievements.length > 0 && (
            <VendorAchievements achievements={achievements} />
          )}

          {/* Tabs */}
          <Tabs defaultValue="products" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="products">
                <Package className="h-4 w-4 mr-2" />
                Products
              </TabsTrigger>
              <TabsTrigger value="posts">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Posts
              </TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>

            {/* Products Tab */}
            <TabsContent value="products" className="space-y-4 mt-6">
              {inventoryLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : inventory.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inventory.map((item) => {
                    const product = item.products as any;
                    return (
                      <Link key={item.id} to={`/product/${product.id}?store=${store.id}`}>
                        <div className="p-4 bg-card border rounded-lg hover:border-primary transition-all hover:shadow-md">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold line-clamp-2">{product.name}</h3>
                              {product.category && (
                                <p className="text-xs text-muted-foreground mt-1">{product.category}</p>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <span className="text-lg font-bold text-primary">${item.price.toFixed(2)}</span>
                              <p className={`text-xs font-medium mt-1 ${item.in_stock ? 'text-accent' : 'text-destructive'}`}>
                                {item.in_stock ? `${item.quantity} left` : 'Out of stock'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 bg-card border rounded-lg text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No products available</p>
                </div>
              )}
            </TabsContent>

            {/* Posts Tab */}
            <TabsContent value="posts" className="space-y-4 mt-6">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <VendorPostCard key={post.id} post={post} onLike={likePost} />
                ))
              ) : (
                <div className="p-12 bg-card border rounded-lg text-center">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No posts yet</p>
                </div>
              )}
            </TabsContent>

            {/* About Tab */}
            <TabsContent value="about" className="space-y-6 mt-6">
              {/* Contact & Location */}
              <div className="space-y-2">
                <h2 className="font-semibold text-lg">Contact & Location</h2>
                <div className="p-4 bg-card border rounded-lg space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
                    <span className="text-sm">{store.address}</span>
                  </div>
                  {store.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-sm">{store.phone}</span>
                    </div>
                  )}
                  {store.email && (
                    <div className="flex items-center gap-3">
                      <span className="text-xl">✉️</span>
                      <span className="text-sm">{store.email}</span>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    {((store as any).google_maps_link || (store.latitude && store.longitude)) && (
                      <Button onClick={handleGetDirections} className="flex-1">
                        <Navigation className="w-4 h-4 mr-2" />
                        Directions
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

              {/* Hours */}
              {store.hours && (
                <div className="space-y-2">
                  <h2 className="font-semibold text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Business Hours
                  </h2>
                  <div className="p-4 bg-card border rounded-lg">
                    {Object.entries(store.hours as Record<string, any>).map(([day, hours]) => {
                      const hoursText = typeof hours === 'string' 
                        ? hours 
                        : hours?.open && hours?.close 
                          ? `${hours.open} - ${hours.close}` 
                          : 'Closed';
                      
                      return (
                        <div key={day} className="flex justify-between text-sm py-2 border-b last:border-0">
                          <span className="capitalize font-medium">{day}</span>
                          <span className="text-muted-foreground">{hoursText}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default StoreProfile;
