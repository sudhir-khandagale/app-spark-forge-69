import { ArrowLeft, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BottomNav from '@/components/BottomNav';

const Search = () => {
  return (
    <div className="flex flex-col min-h-screen pb-16">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <Input
            placeholder="Search for products..."
            className="flex-1"
            defaultValue="Wireless headphones"
          />
          <Button variant="ghost" size="icon">
            <SlidersHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Results */}
      <main className="flex-1 p-4">
        <div className="max-w-lg mx-auto">
          <p className="text-sm text-muted-foreground mb-4">
            Found 12 results near you
          </p>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Link key={i} to={`/product/${i}`}>
                <div className="p-4 bg-card border border-border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">Sony WH-1000XM4</h3>
                    <span className="text-primary font-semibold">$349</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Tech Store Downtown
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-accent font-medium">In Stock</span>
                    <span className="text-muted-foreground">0.5 mi away</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Search;
