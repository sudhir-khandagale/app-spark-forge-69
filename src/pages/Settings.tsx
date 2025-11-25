import { ArrowLeft, Bell, MapPin, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import BottomNav from '@/components/BottomNav';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { useGeolocation } from '@/hooks/useGeolocation';

const Settings = () => {
  const { user } = useUserRole();
  const { toast } = useToast();
  const [searchRadius, setSearchRadius] = useState<number>(10);
  const [loading, setLoading] = useState(true);
  const { latitude, longitude, error: locationError, loading: locationLoading, refresh } = useGeolocation();
  const [locationEnabled, setLocationEnabled] = useState(false);

  useEffect(() => {
    fetchSearchRadius();
  }, [user]);

  useEffect(() => {
    // Check if location is enabled based on coordinates availability
    setLocationEnabled(!!(latitude && longitude));
  }, [latitude, longitude]);

  const fetchSearchRadius = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('search_radius')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (data) {
        setSearchRadius(data.search_radius || 10);
      }
    } catch (error) {
      console.error('Error fetching search radius:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationToggle = async (checked: boolean) => {
    if (checked) {
      // Request location permission
      const result = await refresh();
      if (result) {
        setLocationEnabled(true);
        toast({
          title: "Location Enabled",
          description: "GPS location services are now active",
        });
      } else {
        toast({
          title: "Location Permission Denied",
          description: "Please enable location access in your device settings",
          variant: "destructive",
        });
      }
    } else {
      setLocationEnabled(false);
      toast({
        title: "Location Disabled",
        description: "Distance-based search will be limited",
      });
    }
  };

  const handleRadiusChange = async (newRadius: number) => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to save your search radius preference',
        variant: 'destructive'
      });
      return;
    }

    setSearchRadius(newRadius);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ search_radius: newRadius })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Settings Saved',
        description: `Search radius updated to ${newRadius} km`
      });
    } catch (error: any) {
      console.error('Error updating search radius:', error);
      toast({
        title: 'Error',
        description: 'Failed to update search radius',
        variant: 'destructive'
      });
    }
  };

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
              <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                <div className="flex-1">
                  <Label htmlFor="location-toggle" className="text-base cursor-pointer">Enable Location Services</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Required for distance-based search
                  </p>
                  {locationEnabled && latitude && longitude && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      ✓ Location active: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                    </p>
                  )}
                  {locationError && (
                    <p className="text-xs text-destructive mt-1">
                      ⚠️ {locationError}
                    </p>
                  )}
                </div>
                <Switch 
                  id="location-toggle"
                  checked={locationEnabled} 
                  onCheckedChange={handleLocationToggle}
                  disabled={locationLoading}
                />
              </div>

              <div className="p-3 bg-card border border-border rounded-lg">
                <Label className="block mb-2">Default Search Radius (Kilometers)</Label>
                <select 
                  className="w-full p-2 bg-background border border-input rounded-md"
                  value={searchRadius}
                  onChange={(e) => handleRadiusChange(Number(e.target.value))}
                  disabled={loading || !user}
                >
                  <option value={5}>5 km</option>
                  <option value={10}>10 km</option>
                  <option value={15}>15 km</option>
                  <option value={25}>25 km</option>
                  <option value={50}>50 km</option>
                  <option value={100}>100 km</option>
                </select>
                {!user && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Login to save your preference
                  </p>
                )}
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
