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
import { Package, Upload, Plus, Edit, Trash2, FileSpreadsheet, ImagePlus, Store, X, ArrowLeft, AlertCircle, CheckCircle, XCircle, Minus, Loader2 } from 'lucide-react';
import { VendorNotifications } from '@/components/VendorNotifications';
import VendorAnalyticsDashboard from '@/components/VendorAnalyticsDashboard';
import BulkInventoryUpload from '@/components/BulkInventoryUpload';
import FlashSalesManager from '@/components/FlashSalesManager';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatPrice } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
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
  });
  const [productImage, setProductImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isEditStoreOpen, setIsEditStoreOpen] = useState(false);
  const [editedStore, setEditedStore] = useState<any>(null);
  const [storePhotoFiles, setStorePhotoFiles] = useState<File[]>([]);
  const [storePreviews, setStorePreviews] = useState<string[]>([]);
  const [updatingStock, setUpdatingStock] = useState<string | null>(null);
  const [selectedInventoryId, setSelectedInventoryId] = useState<string | null>(null);

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
    if (!newProduct.name || !newProduct.price || !newProduct.quantity) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields (name, price, quantity)',
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
              price: parseFloat(newProduct.price),
              quantity: parseInt(newProduct.quantity, 10),
              imageUrl,
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
      setNewProduct({ name: '', description: '', category: '', price: '', quantity: '' });
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
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{store.name}</h1>
              <p className="text-muted-foreground">{store.address}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <VendorNotifications storeId={storeId || null} onNotificationClick={handleNotificationClick} />
            <Button variant="outline" onClick={() => navigate(`/store/${storeId}`)}>
              View Public Profile
            </Button>
          </div>
        </div>

        {/* Store Status Alert */}
        {store.status === 'pending' && (
          <Alert className="border-yellow-500/50 bg-yellow-500/10">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              <strong>Store Pending Approval</strong> — Your store is awaiting admin approval. 
              Products you add won't appear in customer searches until your store is approved.
              <span className="block mt-1 text-sm">
                Current products: <strong>{inventory.length}</strong>
              </span>
            </AlertDescription>
          </Alert>
        )}

        {store.status === 'approved' && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <strong>Store Approved</strong> — Your store is live! Customers can now find your products in search.
              <span className="block mt-1 text-sm">
                Total products: <strong>{inventory.length}</strong> | In stock: <strong>{inventory.filter(i => i.in_stock).length}</strong>
              </span>
            </AlertDescription>
          </Alert>
        )}

        {store.status === 'rejected' && (
          <Alert className="border-red-500/50 bg-red-500/10">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              <strong>Store Rejected</strong> — Your store application was not approved.
              {store.rejection_reason && (
                <span className="block mt-1 text-sm">
                  Reason: {store.rejection_reason}
                </span>
              )}
              <span className="block mt-1 text-sm">
                Please update your store details and contact support for resubmission.
              </span>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="analytics">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="flash-sales">Flash Sales</TabsTrigger>
            <TabsTrigger value="bulk-upload">Bulk Upload</TabsTrigger>
            <TabsTrigger value="store-details">Store Details</TabsTrigger>
            <TabsTrigger value="import">Import Products</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-4">
            <VendorAnalyticsDashboard storeId={storeId!} />
          </TabsContent>

          <TabsContent value="flash-sales" className="space-y-4">
            <FlashSalesManager storeId={storeId!} />
          </TabsContent>

          <TabsContent value="bulk-upload" className="space-y-4">
            <BulkInventoryUpload storeId={storeId!} onUploadComplete={fetchStoreData} />
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Inventory Management
                    </CardTitle>
                    <CardDescription>{inventory.length} products in stock</CardDescription>
                  </div>
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Product
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
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

                        <div className="grid grid-cols-2 gap-4">
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
                        <Button onClick={handleAddProduct} className="w-full" disabled={uploading}>
                          {uploading ? 'Adding Product...' : 'Add Product'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="store-details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Edit Store Details
                </CardTitle>
                <CardDescription>Update your store information and photos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {editedStore && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Store Name *</Label>
                      <Input
                        id="edit-name"
                        value={editedStore.name || ''}
                        onChange={(e) => setEditedStore({ ...editedStore, name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-description">Description</Label>
                      <Textarea
                        id="edit-description"
                        value={editedStore.description || ''}
                        onChange={(e) => setEditedStore({ ...editedStore, description: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-address">Address *</Label>
                      <Textarea
                        id="edit-address"
                        value={editedStore.address || ''}
                        onChange={(e) => setEditedStore({ ...editedStore, address: e.target.value })}
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-phone">Phone</Label>
                        <Input
                          id="edit-phone"
                          value={editedStore.phone || ''}
                          onChange={(e) => setEditedStore({ ...editedStore, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-email">Email</Label>
                        <Input
                          id="edit-email"
                          type="email"
                          value={editedStore.email || ''}
                          onChange={(e) => setEditedStore({ ...editedStore, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-specialties">Specialties (comma-separated)</Label>
                      <Input
                        id="edit-specialties"
                        value={Array.isArray(editedStore.specialties) 
                          ? editedStore.specialties.join(', ') 
                          : editedStore.specialties || ''}
                        onChange={(e) => setEditedStore({ ...editedStore, specialties: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Store Photos (up to 5)</Label>
                      <div className="space-y-3">
                        {storePreviews.length > 0 && (
                          <div className="grid grid-cols-3 gap-2">
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
                                  className="absolute -top-2 -right-2 h-6 w-6"
                                  onClick={() => removeStorePhoto(index)}
                                >
                                  <X className="h-3 w-3" />
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

          <TabsContent value="import" className="space-y-4">
            {store.status === 'pending' && (
              <Alert className="border-yellow-500/50 bg-yellow-500/10">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                  <strong>Store Pending Approval</strong> — Products you import will be added to your inventory but won't appear in customer searches until your store is approved by an admin.
                </AlertDescription>
              </Alert>
            )}
            
            {store.status === 'rejected' && (
              <Alert className="border-red-500/50 bg-red-500/10">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  <strong>Store Rejected</strong> — Please update your store details and contact support before importing products.
                </AlertDescription>
              </Alert>
            )}
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Import Products
                </CardTitle>
                <CardDescription>Bulk import products from CSV</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-4">
                  <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="font-medium">Upload CSV File</h3>
                    <p className="text-sm text-muted-foreground">
                      CSV should include: name, description, category, price, quantity
                    </p>
                  </div>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    className="max-w-xs mx-auto"
                  />
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">CSV Format Example:</h4>
                  <code className="text-sm">
                    name,description,category,price,quantity<br />
                    Widget A,Great product,Electronics,29.99,50<br />
                    Widget B,Another product,Hardware,19.99,30
                  </code>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
