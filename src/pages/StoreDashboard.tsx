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
import { Package, Upload, Plus, Edit, Trash2, FileSpreadsheet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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

  useEffect(() => {
    fetchStoreData();
  }, [storeId]);

  const fetchStoreData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Fetch store
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .eq('owner_id', user.id)
        .single();

      if (storeError) throw storeError;
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

  const handleAddProduct = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name: newProduct.name,
          description: newProduct.description,
          category: newProduct.category,
        })
        .select()
        .single();

      if (productError) throw productError;

      // Add to inventory
      const { error: inventoryError } = await supabase
        .from('inventory')
        .insert({
          store_id: storeId,
          product_id: product.id,
          price: parseFloat(newProduct.price),
          quantity: parseInt(newProduct.quantity),
        });

      if (inventoryError) throw inventoryError;

      toast({
        title: 'Success',
        description: 'Product added to inventory',
      });

      setIsAddDialogOpen(false);
      setNewProduct({ name: '', description: '', category: '', price: '', quantity: '' });
      fetchStoreData();
    } catch (error: any) {
      console.error('Error adding product:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add product',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStock = async (inventoryId: string, newQuantity: number) => {
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
    }
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());

      toast({
        title: 'CSV Upload',
        description: `Processing ${lines.length - 1} products...`,
      });

      // This is a basic implementation - you'd want more robust CSV parsing
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',').map(v => v.trim());
        const row: any = {};
        headers.forEach((header, index) => {
          row[header.toLowerCase()] = values[index];
        });

        // Process each row (simplified - add better error handling)
        if (row.name && row.price && row.quantity) {
          try {
            const { data: product } = await supabase
              .from('products')
              .insert({
                name: row.name,
                description: row.description || null,
                category: row.category || null,
              })
              .select()
              .single();

            if (product) {
              await supabase.from('inventory').insert({
                store_id: storeId,
                product_id: product.id,
                price: parseFloat(row.price),
                quantity: parseInt(row.quantity),
              });
            }
          } catch (err) {
            console.error('Error processing row:', err);
          }
        }
      }

      toast({
        title: 'Success',
        description: 'CSV imported successfully',
      });

      fetchStoreData();
    };

    reader.readAsText(file);
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
          <div>
            <h1 className="text-3xl font-bold">{store.name}</h1>
            <p className="text-muted-foreground">{store.address}</p>
          </div>
          <Button variant="outline" onClick={() => navigate(`/store/${storeId}`)}>
            View Public Profile
          </Button>
        </div>

        <Tabs defaultValue="inventory">
          <TabsList>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="import">Import Products</TabsTrigger>
          </TabsList>

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
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="product-name">Product Name *</Label>
                          <Input
                            id="product-name"
                            value={newProduct.name}
                            onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="product-description">Description</Label>
                          <Input
                            id="product-description"
                            value={newProduct.description}
                            onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="product-category">Category</Label>
                          <Input
                            id="product-category"
                            value={newProduct.category}
                            onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="product-price">Price *</Label>
                            <Input
                              id="product-price"
                              type="number"
                              step="0.01"
                              value={newProduct.price}
                              onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="product-quantity">Quantity *</Label>
                            <Input
                              id="product-quantity"
                              type="number"
                              value={newProduct.quantity}
                              onChange={(e) => setNewProduct(prev => ({ ...prev, quantity: e.target.value }))}
                            />
                          </div>
                        </div>
                        <Button onClick={handleAddProduct} className="w-full">Add Product</Button>
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
                      <TableHead>Quantity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.products.name}</div>
                            {item.products.description && (
                              <div className="text-sm text-muted-foreground">{item.products.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{item.products.category || '-'}</TableCell>
                        <TableCell>${item.price.toFixed(2)}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleUpdateStock(item.id, parseInt(e.target.value))}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            item.in_stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {item.in_stock ? 'In Stock' : 'Out of Stock'}
                          </span>
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

          <TabsContent value="import" className="space-y-4">
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
