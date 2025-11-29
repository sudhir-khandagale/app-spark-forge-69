import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Package, Upload, Plus, Edit, Trash2, FileSpreadsheet, ImagePlus, Store, X, ArrowLeft, AlertCircle, CheckCircle, XCircle, Minus, Loader2, Crown, Lock, Sparkles } from 'lucide-react';
import { VendorNotifications } from '@/components/VendorNotifications';
import VendorAnalyticsDashboard from '@/components/VendorAnalyticsDashboard';
import ComprehensiveAnalytics from '@/components/ComprehensiveAnalytics';
import BulkInventoryUpload from '@/components/BulkInventoryUpload';
import FlashSalesManager from '@/components/FlashSalesManager';
import SubscriptionTiersModal from '@/components/SubscriptionTiersModal';
import SubscriptionPlans from '@/components/SubscriptionPlans';
import LockedFeatureOverlay from '@/components/LockedFeatureOverlay';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatPrice } from '@/lib/utils';
import VendorStoriesCarousel from '@/components/vendor/VendorStoriesCarousel';
import CreateStoryModal from '@/components/vendor/CreateStoryModal';
import VendorLeaderboard from '@/components/vendor/VendorLeaderboard';
import VendorChallenges from '@/components/vendor/VendorChallenges';
import { useVendorStories } from '@/hooks/useVendorStories';

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  colors?: string[];
  sizes?: { name: string; measurements: string }[];
}

interface InventoryItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  in_stock: boolean;
  low_stock_threshold?: number;
  products: Product;
}

export default function StoreDashboard() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<any>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    quantity: '',
    colors: [] as string[],
    sizes: [] as { name: string; measurements: string }[],
    useVariants: false
  });
  const [variants, setVariants] = useState<Array<{
    color: string;
    size: string;
    price: string;
    quantity: string;
    sku: string;
  }>>([]);
  const [colorInput, setColorInput] = useState('');
  const [sizeInput, setSizeInput] = useState({ name: '', measurements: '' });
  const [productImage, setProductImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isEditStoreOpen, setIsEditStoreOpen] = useState(false);
  const [editedStore, setEditedStore] = useState<any>(null);
  const [storePhotoFiles, setStorePhotoFiles] = useState<File[]>([]);
  const [storePreviews, setStorePreviews] = useState<string[]>([]);
  const [updatingStock, setUpdatingStock] = useState<string | null>(null);
  const [selectedInventoryId, setSelectedInventoryId] = useState<string | null>(null);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [features, setFeatures] = useState<any>({
    analytics: false,
    flash_sales: false,
    bulk_upload: false,
    priority_support: false,
    featured_listing: false
  });
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const { stories, incrementViews, refreshStories } = useVendorStories(storeId);

  useEffect(() => {
    fetchStoreData();
  }, [storeId]);

  useEffect(() => {
    if (store) {
      setEditedStore({ ...store });
      setStorePreviews(store.photo_urls || []);
    }
  }, [store]);

  const fetchStoreData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Check if user is admin
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      const isAdmin = roleData?.role === 'admin';

      // Fetch store - admins can access any store, vendors only their own
      const storeQuery = supabase
        .from('stores')
        .select('*')
        .eq('id', storeId);

      if (!isAdmin) {
        storeQuery.eq('owner_id', user.id);
      }

      const { data: storeData, error: storeError } = await storeQuery.single();

      if (storeError) {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to access this store',
          variant: 'destructive',
        });
        navigate('/profile');
        return;
      }
      setStore(storeData);

      // Fetch inventory
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select(`
          *,
          products (
            id,
            name,
            description,
            category,
            image_url
          )
        `)
        .eq('store_id', storeId)
        .order('last_updated', { ascending: false });

      if (inventoryError) throw inventoryError;
      setInventory(inventoryData || []);

      // Fetch subscription
      const { data: subData } = await supabase
        .from('vendor_subscriptions')
        .select('*')
        .eq('store_id', storeId)
        .single();

      setSubscription(subData);

      // Get effective features using the database function
      const { data: featuresData } = await supabase
        .rpc('get_subscription_features', { p_store_id: storeId });

      if (featuresData) {
        setFeatures(featuresData);
      }
    } catch (error: any) {
      console.error('Error fetching store data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load store data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProductImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || (!newProduct.useVariants && (!newProduct.price || !newProduct.quantity))) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (newProduct.useVariants && variants.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please add at least one variant',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      let imageUrl = null;

      // Upload image if provided
      if (productImage) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const fileExt = productImage.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, productImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      // Call backend to create product (bypasses RLS)
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/store-dashboard`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: 'create_product',
            data: {
              storeId,
              name: newProduct.name,
              description: newProduct.description || null,
              category: newProduct.category || null,
              price: newProduct.useVariants ? 0 : parseFloat(newProduct.price),
              quantity: newProduct.useVariants ? 0 : parseInt(newProduct.quantity, 10),
              imageUrl,
              colors: newProduct.colors,
              sizes: newProduct.sizes,
              useVariants: newProduct.useVariants,
              variants: newProduct.useVariants ? variants.map(v => ({
                color: v.color || null,
                size: v.size || null,
                sku: v.sku || null,
                price: parseFloat(v.price),
                quantity: parseInt(v.quantity)
              })) : []
            },
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add product');
      }

      toast({
        title: 'Success',
        description: store.status === 'pending' 
          ? 'Product added! It will appear in search once your store is approved.' 
          : 'Product added to inventory',
      });

      setIsAddDialogOpen(false);
      setNewProduct({ name: '', description: '', category: '', price: '', quantity: '', colors: [], sizes: [], useVariants: false });
      setVariants([]);
      setColorInput('');
      setSizeInput({ name: '', measurements: '' });
      setProductImage(null);
      setImagePreview(null);
      fetchStoreData();
    } catch (error: any) {
      console.error('Error adding product:', error, JSON.stringify(error, null, 2));
      toast({
        title: 'Error',
        description: error.message || 'Failed to add product',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateStock = async (inventoryId: string, newQuantity: number) => {
    if (newQuantity < 0) {
      toast({
        title: 'Invalid quantity',
        description: 'Stock quantity cannot be negative',
        variant: 'destructive',
      });
      return;
    }

    setUpdatingStock(inventoryId);

    try {
      const { error } = await supabase
        .from('inventory')
        .update({
          quantity: newQuantity,
          last_updated: new Date().toISOString(),
        })
        .eq('id', inventoryId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Stock updated',
      });

      fetchStoreData();
    } catch (error: any) {
      console.error('Error updating stock:', error);
      toast({
        title: 'Error',
        description: 'Failed to update stock',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStock(null);
    }
  };

  const handleQuickStockUpdate = async (
    inventoryId: string,
    currentQuantity: number,
    change: number
  ) => {
    const newQuantity = Math.max(0, currentQuantity + change);
    await handleUpdateStock(inventoryId, newQuantity);
  };

  const handleNotificationClick = (inventoryId: string) => {
    setSelectedInventoryId(inventoryId);
    setTimeout(() => setSelectedInventoryId(null), 3000);
  };

  const getStockStatusBadge = (quantity: number, threshold: number = 5) => {
    if (quantity === 0)
      return (
        <Badge variant="destructive" className="text-xs">
          Out of Stock
        </Badge>
      );
    if (quantity <= threshold)
      return (
        <Badge variant="outline" className="text-xs border-yellow-600 text-yellow-600">
          Low Stock
        </Badge>
      );
    return (
      <Badge variant="outline" className="text-xs border-green-600 text-green-600">
        In Stock
      </Badge>
    );
  };

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');

        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());

        toast({
          title: 'CSV Upload',
          description: `Processing ${lines.length - 1} products...`,
        });

        const productsForUpload: any[] = [];

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].split(',').map(v => v.trim());
          const row: any = {};
          headers.forEach((header, index) => {
            row[header.toLowerCase()] = values[index];
          });

          if (row.name && row.price && row.quantity) {
            productsForUpload.push({
              name: row.name,
              description: row.description || null,
              category: row.category || null,
              price: parseFloat(row.price),
              quantity: parseInt(row.quantity, 10),
              barcode: row.barcode || null,
            });
          }
        }

        if (productsForUpload.length === 0) {
          toast({
            title: 'Error',
            description: 'No valid products found in CSV',
            variant: 'destructive',
          });
          return;
        }

        // Call backend to bulk upload
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/store-dashboard`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              action: 'bulk_upload',
              data: {
                storeId,
                products: productsForUpload,
              },
            }),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Bulk upload failed');
        }

        toast({
          title: 'CSV Import Complete',
          description: `Imported ${result.success.length} products, ${result.failed.length} failed.`,
        });

        fetchStoreData();
      } catch (err: any) {
        console.error('Error processing CSV:', err, JSON.stringify(err, null, 2));
        toast({
          title: 'Error',
          description: err.message || 'Failed to import CSV',
          variant: 'destructive',
        });
      }
    };

    reader.readAsText(file);
  };

  const handleStorePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newFiles = [...storePhotoFiles, ...files].slice(0, 5);
    setStorePhotoFiles(newFiles);

    const newPreviews = [...storePreviews, ...newFiles.map(file => URL.createObjectURL(file))].slice(0, 5);
    setStorePreviews(newPreviews);
  };

  const removeStorePhoto = (index: number) => {
    const isExistingPhoto = index < (store?.photo_urls?.length || 0);
    
    if (isExistingPhoto) {
      // Remove from existing photos
      setEditedStore((prev: any) => ({
        ...prev,
        photo_urls: prev.photo_urls.filter((_: string, i: number) => i !== index)
      }));
    } else {
      // Remove from new uploads
      const fileIndex = index - (store?.photo_urls?.length || 0);
      setStorePhotoFiles(storePhotoFiles.filter((_, i) => i !== fileIndex));
    }
    
    setStorePreviews(storePreviews.filter((_, i) => i !== index));
  };

  const uploadStorePhotos = async (): Promise<string[]> => {
    if (storePhotoFiles.length === 0) return [];

    const uploadedUrls: string[] = [];

    try {
      for (const file of storePhotoFiles) {
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
    }

    return uploadedUrls;
  };

  const handleUpdateStore = async () => {
    if (!editedStore?.name?.trim() || !editedStore?.address?.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Store name and address are required',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const newPhotoUrls = await uploadStorePhotos();
      const allPhotoUrls = [...(editedStore.photo_urls || []), ...newPhotoUrls];

      const { error } = await supabase
        .from('stores')
        .update({
          name: editedStore.name,
          description: editedStore.description,
          address: editedStore.address,
          phone: editedStore.phone,
          email: editedStore.email,
          hours: editedStore.hours,
          specialties: typeof editedStore.specialties === 'string' 
            ? editedStore.specialties.split(',').map((s: string) => s.trim()).filter(Boolean)
            : editedStore.specialties,
          photo_urls: allPhotoUrls.length > 0 ? allPhotoUrls : null,
        })
        .eq('id', storeId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Store details updated successfully',
      });

      setIsEditStoreOpen(false);
      setStorePhotoFiles([]);
      fetchStoreData();
    } catch (error: any) {
      console.error('Error updating store:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update store',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 pb-20">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background p-4 pb-20">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Store not found</p>
              <Button onClick={() => navigate('/onboarding/merchant')} className="w-full mt-4">
                Register Your Store
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Mobile-optimized Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/profile')} className="shrink-0 mt-1">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold truncate">{store.name}</h1>
                {subscription?.tier === 'premium' && (
                  <Badge className="bg-purple-600 hover:bg-purple-700 text-white shrink-0">
                    <Crown className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                )}
                {subscription?.tier === 'pro' && (
                  <Badge className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
                    <Crown className="h-3 w-3 mr-1" />
                    Pro
                  </Badge>
                )}
                {(!subscription || subscription?.tier === 'free') && (
                  <Badge variant="outline" className="shrink-0">Free</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1 truncate">{store.address}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSubscriptionModalOpen(true)}
              className="gap-2 flex-1 sm:flex-initial"
            >
              <Crown className="h-4 w-4" />
              <span className="hidden sm:inline">
                {subscription?.tier === 'premium' ? 'Premium' : subscription?.tier === 'pro' ? 'Pro Plan' : 'Upgrade'}
              </span>
              <span className="sm:hidden">Plan</span>
            </Button>
            <VendorNotifications storeId={storeId || null} onNotificationClick={handleNotificationClick} />
            <Button variant="outline" size="sm" onClick={() => navigate(`/store/${storeId}`)} className="flex-1 sm:flex-initial">
              <Store className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">View Public Profile</span>
              <span className="sm:hidden">Public</span>
            </Button>
          </div>
        </div>

        <SubscriptionTiersModal
          open={subscriptionModalOpen}
          onOpenChange={setSubscriptionModalOpen}
          storeId={storeId!}
          currentTier={subscription?.tier || 'free'}
          onUpgrade={fetchStoreData}
        />

        {/* Store Status Alerts - Compact */}
        {store.status === 'pending' && (
          <Alert className="border-yellow-500/50 bg-yellow-500/10">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong className="block sm:inline">Store Pending Approval</strong>
              <span className="hidden sm:inline"> — </span>
              <span className="block sm:inline">Products won't appear until approved.</span>
              <span className="block text-xs mt-1">
                Products: <strong>{inventory.length}</strong>
              </span>
            </AlertDescription>
          </Alert>
        )}

        {store.status === 'approved' && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-sm text-green-800 dark:text-green-200">
              <strong className="block sm:inline">Store Live!</strong>
              <span className="hidden sm:inline"> — </span>
              <span className="block sm:inline">Customers can find your products.</span>
              <span className="block text-xs mt-1">
                Total: <strong>{inventory.length}</strong> | In stock: <strong>{inventory.filter(i => i.in_stock).length}</strong>
              </span>
            </AlertDescription>
          </Alert>
        )}

        {store.status === 'rejected' && (
          <Alert className="border-red-500/50 bg-red-500/10">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-sm text-red-800 dark:text-red-200">
              <strong className="block">Store Rejected</strong>
              {store.rejection_reason && (
                <span className="block text-xs mt-1">
                  Reason: {store.rejection_reason}
                </span>
              )}
              <span className="block text-xs mt-1">
                Update details and contact support.
              </span>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="inventory" className="w-full">
          <TabsList className="w-full overflow-x-auto flex justify-start lg:grid lg:grid-cols-9 gap-1 h-auto flex-nowrap p-1">
            <TabsTrigger value="inventory" className="whitespace-nowrap px-4">
              Inventory
            </TabsTrigger>
            <TabsTrigger value="social" className="whitespace-nowrap px-4">
              <Sparkles className="h-3 w-3 mr-1.5 shrink-0" />
              Social
            </TabsTrigger>
            <TabsTrigger value="plans" className="whitespace-nowrap px-3 sm:px-4">
              <Crown className="h-3 w-3 mr-1.5 shrink-0" />
              <span className="hidden sm:inline">Plans</span>
              <span className="sm:hidden">Plans</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="relative whitespace-nowrap px-3">
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Stats</span>
              {!features.analytics && <Lock className="h-3 w-3 ml-1.5 shrink-0 text-muted-foreground" />}
            </TabsTrigger>
            <TabsTrigger value="flash-sales" className="relative whitespace-nowrap px-3">
              <span className="hidden sm:inline">Flash Sales</span>
              <span className="sm:hidden">Sales</span>
              {!features.flash_sales && <Lock className="h-3 w-3 ml-1.5 shrink-0 text-muted-foreground" />}
            </TabsTrigger>
            <TabsTrigger value="bulk-upload" className="relative whitespace-nowrap px-3">
              <span className="hidden sm:inline">Import</span>
              <span className="sm:hidden">Import</span>
              {!features.bulk_upload && <Lock className="h-3 w-3 ml-1.5 shrink-0 text-muted-foreground" />}
            </TabsTrigger>
            <TabsTrigger value="featured" className="relative whitespace-nowrap px-3">
              <span className="hidden sm:inline">Featured</span>
              <span className="sm:hidden">Star</span>
              {!features.featured_listing && <Lock className="h-3 w-3 ml-1.5 shrink-0 text-muted-foreground" />}
            </TabsTrigger>
            <TabsTrigger value="support" className="relative whitespace-nowrap px-3">
              <span className="hidden sm:inline">Support</span>
              <span className="sm:hidden">Help</span>
              {!features.priority_support && <Lock className="h-3 w-3 ml-1.5 shrink-0 text-muted-foreground" />}
            </TabsTrigger>
            <TabsTrigger value="store-details" className="whitespace-nowrap px-4">
              <span className="hidden sm:inline">Store Details</span>
              <span className="sm:hidden">Store</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="social" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Vendor Social Feed
                </CardTitle>
                <CardDescription>
                  Share your story, showcase products, and connect with customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 space-y-4">
                  <div className="text-6xl mb-4">📱</div>
                  <h3 className="text-xl font-semibold">Share Your Story</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Create posts, share behind-the-scenes content, and build a community around your brand
                  </p>
                  <Button onClick={() => navigate('/vendor-feed')} size="lg">
                    Open Social Feed
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans" className="space-y-4">
            <SubscriptionPlans 
              storeId={storeId!} 
              currentTier={subscription?.tier || 'free'}
              onUpgrade={fetchStoreData}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <LockedFeatureOverlay
              isLocked={!features.analytics}
              onUpgrade={() => setSubscriptionModalOpen(true)}
              title="Advanced Analytics"
              description="Get detailed insights into your store's performance, track customer behavior, and identify top-performing products."
              requiredTier="pro"
            >
              <ComprehensiveAnalytics storeId={storeId!} />
            </LockedFeatureOverlay>
          </TabsContent>

          <TabsContent value="flash-sales" className="space-y-4">
            <LockedFeatureOverlay
              isLocked={!features.flash_sales}
              onUpgrade={() => setSubscriptionModalOpen(true)}
              title="Flash Sales & Promotions"
              description="Create time-limited offers to boost sales and attract more customers to your store."
              requiredTier="pro"
            >
              <FlashSalesManager storeId={storeId!} />
            </LockedFeatureOverlay>
          </TabsContent>

          <TabsContent value="bulk-upload" className="space-y-4">
            <LockedFeatureOverlay
              isLocked={!features.bulk_upload}
              onUpgrade={() => setSubscriptionModalOpen(true)}
              title="Bulk CSV Upload"
              description="Save time by uploading up to 500 products at once using our CSV import feature."
              requiredTier="pro"
            >
              <BulkInventoryUpload storeId={storeId!} onUploadComplete={fetchStoreData} />
            </LockedFeatureOverlay>
          </TabsContent>

          <TabsContent value="featured" className="space-y-4">
            <LockedFeatureOverlay
              isLocked={!features.featured_listing}
              onUpgrade={() => setSubscriptionModalOpen(true)}
              title="Featured Store Listing"
              description="Get premium placement in search results and attract 3x more customers to your store."
              requiredTier="premium"
            >
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">Featured Store Status</h3>
                      <p className="text-sm text-muted-foreground">Your store is currently featured in search results</p>
                    </div>
                    <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4 pt-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-3xl font-bold text-primary">+245%</p>
                      <p className="text-sm text-muted-foreground">More Views</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-3xl font-bold text-primary">Top 3</p>
                      <p className="text-sm text-muted-foreground">Search Position</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-3xl font-bold text-primary">⭐ 4.8</p>
                      <p className="text-sm text-muted-foreground">Featured Rating</p>
                    </div>
                  </div>
                </div>
              </Card>
            </LockedFeatureOverlay>
          </TabsContent>

          <TabsContent value="support" className="space-y-4">
            <LockedFeatureOverlay
              isLocked={!features.priority_support}
              onUpgrade={() => setSubscriptionModalOpen(true)}
              title="24/7 Priority Support"
              description="Get instant help from our dedicated support team with faster response times and priority queue."
              requiredTier="premium"
            >
              <Card className="p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Priority Support Access</h3>
                    <p className="text-muted-foreground">Connect with our expert support team anytime</p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="p-4 border-primary">
                      <h4 className="font-semibold mb-2">Live Chat Support</h4>
                      <p className="text-sm text-muted-foreground mb-4">Average response time: &lt;2 minutes</p>
                      <Button className="w-full">Start Chat</Button>
                    </Card>
                    
                    <Card className="p-4">
                      <h4 className="font-semibold mb-2">Dedicated Account Manager</h4>
                      <p className="text-sm text-muted-foreground mb-4">Your personal business advisor</p>
                      <Button variant="outline" className="w-full">Schedule Call</Button>
                    </Card>
                  </div>
                  
                  <Card className="p-4 bg-muted">
                    <h4 className="font-semibold mb-2">Recent Support Tickets</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Inventory sync issue</span>
                        <Badge variant="outline" className="bg-green-100 text-green-700">Resolved</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Payment integration help</span>
                        <Badge variant="outline" className="bg-green-100 text-green-700">Resolved</Badge>
                      </div>
                    </div>
                  </Card>
                </div>
              </Card>
            </LockedFeatureOverlay>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <Package className="h-5 w-5" />
                      Inventory
                    </CardTitle>
                    <CardDescription className="text-sm">{inventory.length} products</CardDescription>
                  </div>
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Product
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto max-w-[95vw] sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Add New Product</DialogTitle>
                        <DialogDescription>Add a new product to your inventory</DialogDescription>
                      </DialogHeader>
                      
                      {store.status === 'pending' && (
                        <Alert className="border-yellow-500/50 bg-yellow-500/10">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <AlertDescription className="text-sm text-yellow-800 dark:text-yellow-200">
                            Your store is pending approval. This product will be added but won't appear in customer searches until your store is approved.
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {store.status === 'rejected' && (
                        <Alert className="border-red-500/50 bg-red-500/10">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-sm text-red-800 dark:text-red-200">
                            Your store has been rejected. Please update your store details before adding products.
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="product-name">Product Name *</Label>
                          <Input
                            id="product-name"
                            value={newProduct.name}
                            onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Wireless Headphones"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="product-description">Description</Label>
                          <Textarea
                            id="product-description"
                            value={newProduct.description}
                            onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Describe your product..."
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="product-category">Category</Label>
                          <Input
                            id="product-category"
                            value={newProduct.category}
                            onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                            placeholder="e.g., Electronics"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="product-image">Product Image</Label>
                          <div className="flex items-center gap-4">
                            {imagePreview ? (
                              <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                                <img 
                                  src={imagePreview} 
                                  alt="Preview" 
                                  className="w-full h-full object-cover"
                                />
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="absolute top-1 right-1"
                                  onClick={() => {
                                    setProductImage(null);
                                    setImagePreview(null);
                                  }}
                                >
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
                                <ImagePlus className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1">
                              <Input
                                id="product-image"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                PNG, JPG, WEBP up to 5MB
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="use-variants"
                              checked={newProduct.useVariants}
                              onChange={(e) => setNewProduct({ ...newProduct, useVariants: e.target.checked })}
                              className="rounded"
                            />
                            <Label htmlFor="use-variants">Track inventory by color/size variants</Label>
                          </div>

                          {!newProduct.useVariants && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="product-price">Price (₹) *</Label>
                                <Input
                                  id="product-price"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={newProduct.price}
                                  onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                                  placeholder="0.00"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="product-quantity">Stock Quantity *</Label>
                                <Input
                                  id="product-quantity"
                                  type="number"
                                  min="0"
                                  value={newProduct.quantity}
                                  onChange={(e) => setNewProduct(prev => ({ ...prev, quantity: e.target.value }))}
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Color Picker */}
                        <div className="space-y-2">
                          <Label htmlFor="product-colors">Available Colors</Label>
                          <div className="flex gap-2">
                            <Input
                              id="product-colors"
                              value={colorInput}
                              onChange={(e) => setColorInput(e.target.value)}
                              placeholder="e.g., Red, Blue, Black"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && colorInput.trim()) {
                                  e.preventDefault();
                                  setNewProduct(prev => ({
                                    ...prev,
                                    colors: [...prev.colors, colorInput.trim()]
                                  }));
                                  setColorInput('');
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                if (colorInput.trim()) {
                                  setNewProduct(prev => ({
                                    ...prev,
                                    colors: [...prev.colors, colorInput.trim()]
                                  }));
                                  setColorInput('');
                                }
                              }}
                            >
                              Add
                            </Button>
                          </div>
                          {newProduct.colors.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {newProduct.colors.map((color, index) => (
                                <Badge key={index} variant="secondary" className="gap-1">
                                  {color}
                                  <X
                                    className="h-3 w-3 cursor-pointer"
                                    onClick={() => {
                                      setNewProduct(prev => ({
                                        ...prev,
                                        colors: prev.colors.filter((_, i) => i !== index)
                                      }));
                                    }}
                                  />
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Size Chart */}
                        <div className="space-y-2">
                          <Label>Size Chart</Label>
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                placeholder="Size (e.g., S, M, L)"
                                value={sizeInput.name}
                                onChange={(e) => setSizeInput(prev => ({ ...prev, name: e.target.value }))}
                              />
                              <Input
                                placeholder="Measurements (e.g., 38-40 inches)"
                                value={sizeInput.measurements}
                                onChange={(e) => setSizeInput(prev => ({ ...prev, measurements: e.target.value }))}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                if (sizeInput.name.trim() && sizeInput.measurements.trim()) {
                                  setNewProduct(prev => ({
                                    ...prev,
                                    sizes: [...prev.sizes, { ...sizeInput }]
                                  }));
                                  setSizeInput({ name: '', measurements: '' });
                                }
                              }}
                            >
                              Add Size
                            </Button>
                          </div>
                          {newProduct.sizes.length > 0 && (
                            <div className="space-y-2 mt-2">
                              {newProduct.sizes.map((size, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                                  <div className="text-sm">
                                    <span className="font-medium">{size.name}</span>: {size.measurements}
                                  </div>
                                  <X
                                    className="h-4 w-4 cursor-pointer"
                                    onClick={() => {
                                      setNewProduct(prev => ({
                                        ...prev,
                                        sizes: prev.sizes.filter((_, i) => i !== index)
                                      }));
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                         </div>

                        {newProduct.useVariants && (
                          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                            <h4 className="font-medium">Product Variants</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <Label>Color</Label>
                                <Input
                                  placeholder="e.g., Red"
                                  id="variant-color"
                                />
                              </div>
                              <div>
                                <Label>Size</Label>
                                <Input
                                  placeholder="e.g., M"
                                  id="variant-size"
                                />
                              </div>
                              <div>
                                <Label>SKU</Label>
                                <Input
                                  placeholder="Optional"
                                  id="variant-sku"
                                />
                              </div>
                              <div>
                                <Label>Price (₹)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  id="variant-price"
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <Label>Quantity</Label>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  id="variant-quantity"
                                />
                              </div>
                            </div>
                            <Button
                              type="button"
                              onClick={() => {
                                const color = (document.getElementById('variant-color') as HTMLInputElement).value;
                                const size = (document.getElementById('variant-size') as HTMLInputElement).value;
                                const sku = (document.getElementById('variant-sku') as HTMLInputElement).value;
                                const price = (document.getElementById('variant-price') as HTMLInputElement).value;
                                const quantity = (document.getElementById('variant-quantity') as HTMLInputElement).value;

                                if (!price || !quantity) {
                                  toast({
                                    title: 'Validation Error',
                                    description: 'Price and quantity are required',
                                    variant: 'destructive',
                                  });
                                  return;
                                }

                                setVariants([...variants, { color, size, sku, price, quantity }]);
                                
                                (document.getElementById('variant-color') as HTMLInputElement).value = '';
                                (document.getElementById('variant-size') as HTMLInputElement).value = '';
                                (document.getElementById('variant-sku') as HTMLInputElement).value = '';
                                (document.getElementById('variant-price') as HTMLInputElement).value = '';
                                (document.getElementById('variant-quantity') as HTMLInputElement).value = '';
                              }}
                              className="w-full"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Variant
                            </Button>

                            {variants.length > 0 && (
                              <div className="space-y-2">
                                {variants.map((variant, index) => (
                                  <div key={index} className="flex items-center justify-between p-3 bg-background rounded border">
                                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                                      <div>
                                        <span className="text-muted-foreground">Color:</span> {variant.color || '-'}
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Size:</span> {variant.size || '-'}
                                      </div>
                                      <div className="hidden sm:block">
                                        <span className="text-muted-foreground">SKU:</span> {variant.sku || '-'}
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Price:</span> ₹{variant.price}
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Qty:</span> {variant.quantity}
                                      </div>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setVariants(variants.filter((_, i) => i !== index))}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        <Button onClick={handleAddProduct} className="w-full" disabled={uploading}>
                          {uploading ? 'Adding Product...' : 'Add Product'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Variants</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock Controls</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                    {inventory.map((item) => (
                      <TableRow 
                        key={item.id}
                        className={
                          selectedInventoryId === item.id
                            ? "bg-muted/50 border-l-4 border-l-primary"
                            : ""
                        }
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {item.products.image_url ? (
                              <img 
                                src={item.products.image_url} 
                                alt={item.products.name}
                                className="w-12 h-12 rounded object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                                <Package className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{item.products.name}</div>
                              {item.products.description && (
                                <div className="text-sm text-muted-foreground line-clamp-1">
                                  {item.products.description}
                                </div>
                              )}
                              {getStockStatusBadge(item.quantity, item.low_stock_threshold || 5)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{item.products.category || '-'}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {item.products.colors && item.products.colors.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {item.products.colors.map((color, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {color}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {item.products.sizes && item.products.sizes.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Sizes: {item.products.sizes.map(s => s.name).join(', ')}
                              </div>
                            )}
                            {(!item.products.colors || item.products.colors.length === 0) && 
                             (!item.products.sizes || item.products.sizes.length === 0) && (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatPrice(item.price)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleQuickStockUpdate(item.id, item.quantity, -5)}
                                  disabled={updatingStock === item.id || item.quantity < 5}
                                  className="h-7 w-8 p-0 text-xs"
                                >
                                  -5
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleQuickStockUpdate(item.id, item.quantity, -1)}
                                  disabled={updatingStock === item.id || item.quantity < 1}
                                  className="h-7 w-7 p-0"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateStock(item.id, parseInt(e.target.value) || 0)}
                                  className="w-16 h-7 text-center"
                                  min="0"
                                  disabled={updatingStock === item.id}
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleQuickStockUpdate(item.id, item.quantity, 1)}
                                  disabled={updatingStock === item.id}
                                  className="h-7 w-7 p-0"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleQuickStockUpdate(item.id, item.quantity, 5)}
                                  disabled={updatingStock === item.id}
                                  className="h-7 w-8 p-0 text-xs"
                                >
                                  +5
                                </Button>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleQuickStockUpdate(item.id, item.quantity, 10)}
                                  disabled={updatingStock === item.id}
                                  className="h-6 text-xs flex-1"
                                >
                                  +10
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleQuickStockUpdate(item.id, item.quantity, -10)}
                                  disabled={updatingStock === item.id || item.quantity < 10}
                                  className="h-6 text-xs flex-1"
                                >
                                  -10
                                </Button>
                              </div>
                            </div>
                            {updatingStock === item.id && (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {inventory.map((item) => (
                    <Card 
                      key={item.id}
                      className={selectedInventoryId === item.id ? "border-l-4 border-l-primary" : ""}
                    >
                      <CardContent className="p-4 space-y-3">
                        {/* Product Header */}
                        <div className="flex items-start gap-3">
                          {item.products.image_url ? (
                            <img 
                              src={item.products.image_url} 
                              alt={item.products.name}
                              className="w-16 h-16 rounded object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded bg-muted flex items-center justify-center shrink-0">
                              <Package className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-base line-clamp-2">{item.products.name}</h3>
                            {item.products.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {item.products.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              {getStockStatusBadge(item.quantity, item.low_stock_threshold || 5)}
                              {item.products.category && (
                                <Badge variant="outline" className="text-xs">{item.products.category}</Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Variants */}
                        {((item.products.colors && item.products.colors.length > 0) || 
                          (item.products.sizes && item.products.sizes.length > 0)) && (
                          <div className="space-y-2 border-t pt-3">
                            {item.products.colors && item.products.colors.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {item.products.colors.map((color, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {color}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {item.products.sizes && item.products.sizes.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Sizes: {item.products.sizes.map(s => s.name).join(', ')}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Price */}
                        <div className="flex items-center justify-between border-t pt-3">
                          <span className="text-sm text-muted-foreground">Price:</span>
                          <span className="text-lg font-semibold">{formatPrice(item.price)}</span>
                        </div>

                        {/* Stock Controls */}
                        <div className="border-t pt-3">
                          <span className="text-sm text-muted-foreground mb-2 block">Stock Quantity:</span>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuickStockUpdate(item.id, item.quantity, -5)}
                                disabled={updatingStock === item.id || item.quantity < 5}
                                className="flex-1 h-9"
                              >
                                -5
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuickStockUpdate(item.id, item.quantity, -1)}
                                disabled={updatingStock === item.id || item.quantity < 1}
                                className="w-12 h-9"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleUpdateStock(item.id, parseInt(e.target.value) || 0)}
                                className="w-20 h-9 text-center text-base font-medium"
                                min="0"
                                disabled={updatingStock === item.id}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuickStockUpdate(item.id, item.quantity, 1)}
                                disabled={updatingStock === item.id}
                                className="w-12 h-9"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuickStockUpdate(item.id, item.quantity, 5)}
                                disabled={updatingStock === item.id}
                                className="flex-1 h-9"
                              >
                                +5
                              </Button>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuickStockUpdate(item.id, item.quantity, -10)}
                                disabled={updatingStock === item.id || item.quantity < 10}
                                className="flex-1 h-9"
                              >
                                -10
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuickStockUpdate(item.id, item.quantity, 10)}
                                disabled={updatingStock === item.id}
                                className="flex-1 h-9"
                              >
                                +10
                              </Button>
                            </div>
                          </div>
                          {updatingStock === item.id && (
                            <div className="flex items-center justify-center mt-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="ml-2 text-sm">Updating...</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 border-t pt-3">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="store-details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Store className="h-5 w-5" />
                  Store Details
                </CardTitle>
                <CardDescription className="text-sm">Update your store information and photos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {editedStore && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="edit-name" className="text-sm">Store Name *</Label>
                      <Input
                        id="edit-name"
                        value={editedStore.name || ''}
                        onChange={(e) => setEditedStore({ ...editedStore, name: e.target.value })}
                        className="text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-description" className="text-sm">Description</Label>
                      <Textarea
                        id="edit-description"
                        value={editedStore.description || ''}
                        onChange={(e) => setEditedStore({ ...editedStore, description: e.target.value })}
                        rows={3}
                        className="text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-address" className="text-sm">Address *</Label>
                      <Textarea
                        id="edit-address"
                        value={editedStore.address || ''}
                        onChange={(e) => setEditedStore({ ...editedStore, address: e.target.value })}
                        rows={2}
                        className="text-base"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-phone" className="text-sm">Phone</Label>
                        <Input
                          id="edit-phone"
                          type="tel"
                          value={editedStore.phone || ''}
                          onChange={(e) => setEditedStore({ ...editedStore, phone: e.target.value })}
                          className="text-base"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-email" className="text-sm">Email</Label>
                        <Input
                          id="edit-email"
                          type="email"
                          value={editedStore.email || ''}
                          onChange={(e) => setEditedStore({ ...editedStore, email: e.target.value })}
                          className="text-base"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-specialties" className="text-sm">Specialties (comma-separated)</Label>
                      <Input
                        id="edit-specialties"
                        value={Array.isArray(editedStore.specialties) 
                          ? editedStore.specialties.join(', ') 
                          : editedStore.specialties || ''}
                        onChange={(e) => setEditedStore({ ...editedStore, specialties: e.target.value })}
                        placeholder="e.g. Electronics, Home Appliances"
                        className="text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-google-maps" className="text-sm">Google Maps Link</Label>
                      <Input
                        id="edit-google-maps"
                        type="url"
                        value={(editedStore as any).google_maps_link || ''}
                        onChange={(e) => setEditedStore({ ...editedStore, google_maps_link: e.target.value })}
                        placeholder="https://maps.app.goo.gl/..."
                        className="text-base"
                      />
                      <p className="text-xs text-muted-foreground">
                        Paste your Google Maps share link here for customers to navigate to your store
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Store Photos (up to 5)</Label>
                      <div className="space-y-3">
                        {storePreviews.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {storePreviews.map((preview, index) => (
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
                                  className="absolute -top-2 -right-2 h-7 w-7"
                                  onClick={() => removeStorePhoto(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        {storePreviews.length < 5 && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleStorePhotoChange}
                              disabled={storePreviews.length >= 5}
                              className="flex-1"
                            />
                            <ImagePlus className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {storePreviews.length}/5 photos
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                      <h3 className="font-medium">Business Hours</h3>
                      {editedStore.hours && Object.keys(editedStore.hours).map((day) => (
                        <div key={day} className="flex items-center gap-4">
                          <Label className="w-24 capitalize">{day}</Label>
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              type="time"
                              value={editedStore.hours[day].open}
                              onChange={(e) => setEditedStore({
                                ...editedStore,
                                hours: {
                                  ...editedStore.hours,
                                  [day]: { ...editedStore.hours[day], open: e.target.value }
                                }
                              })}
                              disabled={editedStore.hours[day].open === 'closed'}
                              className="flex-1"
                            />
                            <span className="text-muted-foreground">to</span>
                            <Input
                              type="time"
                              value={editedStore.hours[day].close}
                              onChange={(e) => setEditedStore({
                                ...editedStore,
                                hours: {
                                  ...editedStore.hours,
                                  [day]: { ...editedStore.hours[day], close: e.target.value }
                                }
                              })}
                              disabled={editedStore.hours[day].close === 'closed'}
                              className="flex-1"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const isClosed = editedStore.hours[day].open === 'closed';
                                setEditedStore({
                                  ...editedStore,
                                  hours: {
                                    ...editedStore.hours,
                                    [day]: {
                                      open: isClosed ? '09:00' : 'closed',
                                      close: isClosed ? '17:00' : 'closed'
                                    }
                                  }
                                });
                              }}
                            >
                              {editedStore.hours[day].open === 'closed' ? 'Open' : 'Closed'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button 
                      onClick={handleUpdateStore} 
                      disabled={uploading || !editedStore.name?.trim() || !editedStore.address?.trim()}
                      className="w-full"
                    >
                      {uploading ? 'Updating...' : 'Save Changes'}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        <TabsContent value="challenges" className="space-y-6">
          <VendorChallenges storeId={storeId!} />
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6">
          <VendorLeaderboard />
        </TabsContent>
      </div>

      <CreateStoryModal 
        open={storyModalOpen}
        onOpenChange={setStoryModalOpen}
        storeId={storeId!}
        onStoryCreated={refreshStories}
      />
    </div>
  );
}
