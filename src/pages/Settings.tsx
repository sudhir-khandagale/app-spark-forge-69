import { ArrowLeft, Bell, MapPin, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import BottomNav from '@/components/BottomNav';
import { ThemeToggle } from '@/components/ThemeToggle';

const Settings = () => {
  return (
    <div className="flex flex-col min-h-screen pb-16">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Link to="/profile">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </header>

      {/* Settings */}
      <main className="flex-1 p-4">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Notifications */}
          <div>
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                <Label htmlFor="price-alerts" className="cursor-pointer">
                  Price Drop Alerts
                </Label>
                <Switch id="price-alerts" defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                <Label htmlFor="stock-alerts" className="cursor-pointer">
                  Stock Availability
                </Label>
                <Switch id="stock-alerts" defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                <Label htmlFor="reservation-alerts" className="cursor-pointer">
                  Reservation Reminders
                </Label>
                <Switch id="reservation-alerts" defaultChecked />
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Location
            </h2>
            <div className="space-y-3">
              <div className="p-3 bg-card border border-border rounded-lg">
                <Label className="block mb-2">Default Search Radius</Label>
                <select className="w-full p-2 bg-background border border-input rounded-md">
                  <option>5 miles</option>
                  <option>10 miles</option>
                  <option>25 miles</option>
                  <option>50 miles</option>
                </select>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div>
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Preferences
            </h2>
            <div className="space-y-3">
              <div className="p-3 bg-card border border-border rounded-lg">
                <Label className="block mb-2">Language</Label>
                <select className="w-full p-2 bg-background border border-input rounded-md">
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                </select>
              </div>
              <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                <Label className="cursor-pointer">
                  Theme
                </Label>
                <ThemeToggle />
              </div>
            </div>
          </div>

          {/* Account */}
          <div>
            <h2 className="font-semibold mb-3">Account</h2>
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start">
                Privacy Policy
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                Terms of Service
              </Button>
              <Button variant="ghost" className="w-full justify-start text-destructive">
                Delete Account
              </Button>
            </div>
          </div>

          <div className="pt-4 text-center text-sm text-muted-foreground">
            Version 1.0.0
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Settings;
