import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Store, MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function MerchantOnboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('store-info');

  const [storeData, setStoreData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    latitude: '',
    longitude: '',
    hours: {
      monday: { open: '09:00', close: '17:00' },
      tuesday: { open: '09:00', close: '17:00' },
      wednesday: { open: '09:00', close: '17:00' },
      thursday: { open: '09:00', close: '17:00' },
      friday: { open: '09:00', close: '17:00' },
      saturday: { open: '10:00', close: '14:00' },
      sunday: { open: 'closed', close: 'closed' },
    },
    specialties: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setStoreData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // First, assign vendor role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: user.id, role: 'vendor' });

      if (roleError && roleError.code !== '23505') throw roleError; // Ignore duplicate key errors

      // Create store
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .insert({
          owner_id: user.id,
          name: storeData.name,
          description: storeData.description,
          address: storeData.address,
          phone: storeData.phone,
          email: storeData.email,
          latitude: storeData.latitude ? parseFloat(storeData.latitude) : null,
          longitude: storeData.longitude ? parseFloat(storeData.longitude) : null,
          hours: storeData.hours,
          specialties: storeData.specialties.split(',').map(s => s.trim()).filter(Boolean),
        })
        .select()
        .single();

      if (storeError) throw storeError;

      toast({
        title: 'Success!',
        description: 'Your store has been registered successfully.',
      });

      navigate(`/dashboard/store/${store.id}`);
    } catch (error: any) {
      console.error('Error creating store:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to register store',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Merchant Onboarding</h1>
          <p className="text-muted-foreground">Join AassPass and connect with local shoppers</p>
        </div>

        <Tabs value={currentStep} onValueChange={setCurrentStep}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="store-info">Store Information</TabsTrigger>
            <TabsTrigger value="business-hours">Business Hours</TabsTrigger>
          </TabsList>

          <TabsContent value="store-info">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Store Details
                </CardTitle>
                <CardDescription>Tell us about your store</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Store Name *</Label>
                  <Input
                    id="name"
                    placeholder="My Amazing Store"
                    value={storeData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Tell customers what makes your store special"
                    value={storeData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address *
                  </Label>
                  <Input
                    id="address"
                    placeholder="123 Main St, City, State 12345"
                    value={storeData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      placeholder="40.7128"
                      value={storeData.latitude}
                      onChange={(e) => handleInputChange('latitude', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      placeholder="-74.0060"
                      value={storeData.longitude}
                      onChange={(e) => handleInputChange('longitude', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    placeholder="(555) 123-4567"
                    value={storeData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="store@example.com"
                    value={storeData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialties">Specialties (comma-separated)</Label>
                  <Input
                    id="specialties"
                    placeholder="Electronics, Hardware, Tools"
                    value={storeData.specialties}
                    onChange={(e) => handleInputChange('specialties', e.target.value)}
                  />
                </div>

                <Button onClick={() => setCurrentStep('business-hours')} className="w-full">
                  Next: Business Hours
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="business-hours">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Business Hours
                </CardTitle>
                <CardDescription>Set your operating hours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Default hours have been set (Mon-Fri: 9am-5pm, Sat: 10am-2pm, Sun: Closed). You can customize these in your dashboard after registration.
                </p>

                <div className="space-y-4 pt-4">
                  <Button onClick={handleSubmit} disabled={loading || !storeData.name || !storeData.address} className="w-full">
                    {loading ? 'Creating Store...' : 'Complete Registration'}
                  </Button>
                  <Button variant="outline" onClick={() => setCurrentStep('store-info')} className="w-full">
                    Back
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
