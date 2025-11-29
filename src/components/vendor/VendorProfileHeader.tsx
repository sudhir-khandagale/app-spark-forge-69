import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Star, Package, ShoppingBag, Users, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

interface VendorProfileHeaderProps {
  store: {
    name: string;
    description: string;
    address: string;
    rating: number;
    review_count: number;
    photo_urls: string[];
    specialties: string[];
  };
  stats: {
    products: number;
    orders: number;
    followers: number;
  };
  isOwner: boolean;
  isFollowing: boolean;
  onFollow: () => void;
}

export const VendorProfileHeader = ({
  store,
  stats,
  isOwner,
  isFollowing,
  onFollow,
}: VendorProfileHeaderProps) => {
  return (
    <Card className="overflow-hidden">
      {/* Banner */}
      <div className="relative h-48 bg-gradient-to-r from-primary via-primary/80 to-primary/60">
        {store.photo_urls && store.photo_urls[0] && (
          <img
            src={store.photo_urls[0]}
            alt={store.name}
            className="w-full h-full object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Profile Content */}
      <div className="relative px-6 pb-6">
        {/* Avatar */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="absolute -top-20 left-6"
        >
          <Avatar className="h-32 w-32 border-4 border-background shadow-xl ring-4 ring-primary/20">
            <AvatarImage src={store.photo_urls?.[1] || store.photo_urls?.[0]} />
            <AvatarFallback className="text-3xl">{store.name[0]}</AvatarFallback>
          </Avatar>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4">
          {isOwner ? (
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <Button
              size="sm"
              variant={isFollowing ? "outline" : "default"}
              onClick={onFollow}
            >
              <Users className="h-4 w-4 mr-2" />
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
          )}
        </div>

        {/* Store Info */}
        <div className="mt-8 space-y-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              {store.name}
              {store.rating >= 4.5 && (
                <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600">
                  ⭐ Top Rated
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground mt-2">{store.description}</p>
          </div>

          {/* Location & Rating */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{store.address}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{store.rating}</span>
              <span className="text-muted-foreground">({store.review_count} reviews)</span>
            </div>
          </div>

          {/* Specialties */}
          {store.specialties && store.specialties.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {store.specialties.map((specialty) => (
                <Badge key={specialty} variant="secondary">
                  {specialty}
                </Badge>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="text-center p-4 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
              <Package className="h-5 w-5 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{stats.products}</div>
              <div className="text-xs text-muted-foreground">Products</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
              <ShoppingBag className="h-5 w-5 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{stats.orders}</div>
              <div className="text-xs text-muted-foreground">Orders</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
              <Users className="h-5 w-5 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{stats.followers}</div>
              <div className="text-xs text-muted-foreground">Followers</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
