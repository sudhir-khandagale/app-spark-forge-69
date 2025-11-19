import { ArrowLeft, Heart, Share2, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/BottomNav';

const ProductDetails = () => {
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
      <div className="aspect-square bg-muted flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-muted-foreground">Product Image</p>
        </div>
      </div>

      {/* Product Info */}
      <main className="flex-1 p-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold mb-2">Sony WH-1000XM4</h1>
          <p className="text-muted-foreground mb-4">
            Premium wireless noise-canceling headphones
          </p>

          {/* Available Stores */}
          <div className="mb-6">
            <h2 className="font-semibold mb-3">Available at 3 stores</h2>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 bg-card border border-border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">Tech Store Downtown</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="w-4 h-4" />
                        <span>0.5 mi away</span>
                      </div>
                    </div>
                    <span className="text-primary font-semibold text-lg">$349</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-sm text-accent font-medium">In Stock</span>
                    <Button size="sm" className="ml-auto">
                      Reserve
                    </Button>
                    <Link to="/store/1">
                      <Button size="sm" variant="outline">
                        View Store
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default ProductDetails;
