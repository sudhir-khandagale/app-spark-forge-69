import { ArrowLeft, Plus, Share2, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import BottomNav from '@/components/BottomNav';

const ListDetails = () => {
  return (
    <div className="flex flex-col min-h-screen pb-16">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Link to="/lists">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
          <h1 className="text-2xl font-bold">Weekly Groceries</h1>
        </div>
      </header>

      {/* Add Item */}
      <div className="p-4 border-b border-border">
        <div className="max-w-lg mx-auto flex gap-2">
          <Input placeholder="Add item to list..." />
          <Button size="icon">
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* List Items */}
      <main className="flex-1 p-4">
        <div className="max-w-lg mx-auto space-y-2">
          {[
            { name: 'Milk', available: true, price: '$3.99' },
            { name: 'Bread', available: true, price: '$2.49' },
            { name: 'Eggs', available: false, price: '-' },
            { name: 'Cheese', available: true, price: '$5.99' },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg"
            >
              <Checkbox />
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                <p className={`text-sm ${item.available ? 'text-accent' : 'text-muted-foreground'}`}>
                  {item.available ? 'Available' : 'Not found'}
                </p>
              </div>
              <span className="font-semibold">{item.price}</span>
            </div>
          ))}
        </div>
      </main>

      {/* Action Button */}
      <div className="p-4 border-t border-border">
        <div className="max-w-lg mx-auto">
          <Button className="w-full" size="lg">
            Find All Items
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default ListDetails;
