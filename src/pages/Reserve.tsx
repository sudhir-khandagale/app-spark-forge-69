import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import BottomNav from '@/components/BottomNav';

const Reserve = () => {
  return (
    <div className="flex flex-col min-h-screen pb-16">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Link to="/product/1">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Reserve Item</h1>
        </div>
      </header>

      {/* Reservation Form */}
      <main className="flex-1 p-4">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Product Summary */}
          <div className="p-4 bg-card border border-border rounded-lg">
            <h3 className="font-semibold mb-1">Sony WH-1000XM4</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Tech Store Downtown
            </p>
            <p className="text-lg font-semibold text-primary">$349</p>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" placeholder="(555) 123-4567" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="john@example.com" />
            </div>
          </div>

          {/* Pickup Time */}
          <div className="space-y-2">
            <Label htmlFor="pickup">Pickup Time</Label>
            <select
              id="pickup"
              className="w-full p-2 bg-background border border-input rounded-md"
            >
              <option>Within 2 hours</option>
              <option>Within 4 hours</option>
              <option>Today (before closing)</option>
              <option>Tomorrow</option>
            </select>
          </div>

          {/* Terms */}
          <div className="flex items-start gap-2">
            <Checkbox id="terms" />
            <Label htmlFor="terms" className="text-sm cursor-pointer leading-tight">
              I agree to the store's reservation policy and understand that this
              item will be held for the selected timeframe.
            </Label>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-4">
            <Button className="w-full" size="lg">
              Confirm Reservation
            </Button>
            <Link to="/product/1">
              <Button variant="outline" className="w-full">
                Cancel
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Reserve;
