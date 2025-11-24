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
import { Store, Phone, Mail, Clock, ImagePlus, X, ArrowLeft, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function MerchantOnboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('store-info');
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [mapsUrlError, setMapsUrlError] = useState('');

  const [storeData, setStoreData] = useState({
    name: '',
    description: '',
    mapsUrl: '',
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

  const isValidGoogleMapsUrl = (url: string): boolean => {
    if (!url.trim()) return false;
    
    // Check if it's a valid Google Maps URL
    const googleMapsPatterns = [
      /^https?:\/\/(www\.)?google\.[a-z]+\/maps/i,
      /^https?:\/\/maps\.google\.[a-z]+/i,
      /^https?:\/\/goo\.gl\/maps/i,
      /^https?:\/\/maps\.app\.goo\.gl/i,
    ];
    
    return googleMapsPatterns.some(pattern => pattern.test(url));
  };

  const handleMapsUrlChange = (url: string) => {
    setStoreData(prev => ({ ...prev, mapsUrl: url }));
    
    // Clear error when user starts typing
    if (mapsUrlError && url.trim()) {
      setMapsUrlError('');
    }
    
    // Validate URL format if not empty
    if (url.trim() && !isValidGoogleMapsUrl(url)) {
      setMapsUrlError('Please enter a valid Google Maps URL');
      return;
    }
    
    // Try to extract coordinates from Google Maps URL
    try {
      // Pattern 1: /@lat,lng,zoom
      let match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+),/);
      if (match) {
        setStoreData(prev => ({
          ...prev,
          latitude: match![1],
          longitude: match![2],
          address: url,
        }));
        setMapsUrlError('');
        return;
      }
      
      // Pattern 2: ?q=lat,lng
      match = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (match) {
        setStoreData(prev => ({
          ...prev,
          latitude: match![1],
          longitude: match![2],
          address: url,
        }));
        setMapsUrlError('');
        return;
      }
      
      // Pattern 3: /place/ with coordinates
      match = url.match(/\/place\/[^/]+\/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (match) {
        setStoreData(prev => ({
          ...prev,
          latitude: match![1],
          longitude: match![2],
          address: url,
        }));
        setMapsUrlError('');
        return;
      }
      
      // If valid URL but no coordinates found, just store the URL
      if (isValidGoogleMapsUrl(url)) {
        setStoreData(prev => ({
          ...prev,
          address: url,
        }));
        setMapsUrlError('');
      }
    } catch (error) {
      // If parsing fails but URL is valid, just store the URL
      if (isValidGoogleMapsUrl(url)) {
        setStoreData(prev => ({
          ...prev,
          address: url,
        }));
        setMapsUrlError('');
      }
    }
  };

  const handleHoursChange = (day: string, field: 'open' | 'close', value: string) => {
    setStoreData(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: {
          ...prev.hours[day as keyof typeof prev.hours],
          [field]: value,
        },
      },
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 5 photos
    const newFiles = [...photoFiles, ...files].slice(0, 5);
    setPhotoFiles(newFiles);

    // Create previews
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setPhotoPreviews(newPreviews);
  };

  const removePhoto = (index: number) => {
    const newFiles = photoFiles.filter((_, i) => i !== index);
    const newPreviews = photoPreviews.filter((_, i) => i !== index);
    setPhotoFiles(newFiles);
    setPhotoPreviews(newPreviews);
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (photoFiles.length === 0) return [];

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of photoFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `store-photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload some photos',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }

    return uploadedUrls;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload photos first
      const photoUrls = await uploadPhotos();

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
          photo_urls: photoUrls.length > 0 ? photoUrls : null,
          status: 'pending',
        })
        .select()
        .single();

      if (storeError) throw storeError;

      toast({
        title: 'Success!',
        description: 'Your store has been submitted for approval. You will be notified once it is reviewed by our admin team.',
      });

      navigate('/profile');
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
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Merchant Onboarding</h1>
          <p className="text-muted-foreground">Join AassPass and connect with local shoppers</p>
        </div>

        <Alert className="border-blue-500/50 bg-blue-500/10">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <strong>Approval Process</strong> — After submitting your store, an admin will review your application. 
            Once approved, your store and products will be visible to customers in search. 
            You can add products immediately, but they won't appear until your store is approved.
          </AlertDescription>
        </Alert>

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

                <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-primary" />
                    <Label htmlFor="maps-url">Google Maps Location *</Label>
                  </div>
                  
                  <Alert className="bg-blue-500/10 border-blue-500/30">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-sm text-muted-foreground">
                      <strong>How to get your location link:</strong>
                      <ol className="mt-2 ml-4 space-y-1 list-decimal">
                        <li>Open Google Maps and find your store location</li>
                        <li>Click "Share" button</li>
                        <li>Click "Copy link" </li>
                        <li>Paste the link in the field below</li>
                      </ol>
                    </AlertDescription>
                  </Alert>

                  <Input
                    id="maps-url"
                    placeholder="https://maps.google.com/..."
                    value={storeData.mapsUrl}
                    onChange={(e) => handleMapsUrlChange(e.target.value)}
                    required
                    className={`font-mono text-sm ${mapsUrlError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  />
                  
                  {mapsUrlError && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      ✗ {mapsUrlError}
                    </p>
                  )}
                  
                  {!mapsUrlError && storeData.latitude && storeData.longitude && (
                    <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                      ✓ Coordinates detected: {parseFloat(storeData.latitude).toFixed(6)}, {parseFloat(storeData.longitude).toFixed(6)}
                    </p>
                  )}
                  
                  {!mapsUrlError && storeData.mapsUrl && !storeData.latitude && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      ⚠ Valid URL but coordinates not detected. Your location will still be saved.
                    </p>
                  )}
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

                <div className="space-y-2">
                  <Label>Store Photos (up to 5)</Label>
                  <div className="space-y-3">
                    {photoPreviews.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {photoPreviews.map((preview, index) => (
                          <div key={index} className="relative aspect-square">
                            <img
                              src={preview}
                              alt={`Store photo ${index + 1}`}
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6"
                              onClick={() => removePhoto(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Input
                        id="photos"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoChange}
                        disabled={photoFiles.length >= 5}
                        className="flex-1"
                      />
                      <ImagePlus className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {photoFiles.length}/5 photos uploaded
                    </p>
                  </div>
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
                <CardDescription>Set your operating hours for each day</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.keys(storeData.hours).map((day) => (
                  <div key={day} className="flex items-center gap-4">
                    <Label className="w-24 capitalize">{day}</Label>
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="time"
                        value={storeData.hours[day as keyof typeof storeData.hours].open}
                        onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                        className="flex-1"
                        disabled={storeData.hours[day as keyof typeof storeData.hours].open === 'closed'}
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={storeData.hours[day as keyof typeof storeData.hours].close}
                        onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                        className="flex-1"
                        disabled={storeData.hours[day as keyof typeof storeData.hours].close === 'closed'}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const isClosed = storeData.hours[day as keyof typeof storeData.hours].open === 'closed';
                          handleHoursChange(day, 'open', isClosed ? '09:00' : 'closed');
                          handleHoursChange(day, 'close', isClosed ? '17:00' : 'closed');
                        }}
                      >
                        {storeData.hours[day as keyof typeof storeData.hours].open === 'closed' ? 'Open' : 'Closed'}
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="space-y-4 pt-4 border-t">
                  <Button 
                    onClick={handleSubmit} 
                    disabled={loading || uploading || !storeData.name.trim() || !storeData.mapsUrl.trim() || !!mapsUrlError} 
                    className="w-full"
                  >
                    {loading ? 'Creating Store...' : uploading ? 'Uploading Photos...' : 'Complete Registration'}
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
