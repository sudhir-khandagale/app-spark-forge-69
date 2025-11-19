import { ArrowLeft, Heart, Phone, Clock, Navigation, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/BottomNav';

const StoreProfile = () => {
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
      <div className="p-4 border-b border-border">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold mb-2">Tech Store Downtown</h1>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-primary text-primary" />
              <span className="font-semibold">4.8</span>
            </div>
            <span className="text-muted-foreground">(234 reviews)</span>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1">
              <Navigation className="w-4 h-4 mr-2" />
              Get Directions
            </Button>
            <Button variant="outline" size="icon">
              <Phone className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Store Info */}
      <main className="flex-1 p-4">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Hours */}
          <div>
            <h2 className="font-semibold mb-2 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Hours
            </h2>
            <p className="text-sm text-accent font-medium">Open now</p>
            <p className="text-sm text-muted-foreground">Mon-Fri: 9:00 AM - 8:00 PM</p>
            <p className="text-sm text-muted-foreground">Sat-Sun: 10:00 AM - 6:00 PM</p>
          </div>

          {/* Available Products */}
          <div>
            <h2 className="font-semibold mb-3">Available Products</h2>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Link key={i} to={`/product/${i}`}>
                  <div className="p-4 bg-card border border-border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">Sony WH-1000XM4</h3>
                        <p className="text-sm text-accent font-medium mt-1">In Stock</p>
                      </div>
                      <span className="text-primary font-semibold">$349</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default StoreProfile;
