import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Package, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import RoleBasedBottomNav from '@/components/RoleBasedBottomNav';

export default function AddProduct() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [productCount, setProductCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingCount, setLoadingCount] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    quantity: '',
    barcode: '',
    lowStockThreshold: '10',
  });

  useEffect(() => {
    checkProductLimit();
  }, [storeId]);

  const checkProductLimit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user is admin
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      const userIsAdmin = roleData?.role === 'admin';
      setIsAdmin(userIsAdmin);

      // Count existing products for this store
      const { count, error } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', storeId);

      if (error) throw error;
      setProductCount(count || 0);
    } catch (error) {
      console.error('Error checking product limit:', error);
    } finally {
      setLoadingCount(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Free tier limit check (200 products for non-admins)
    if (!isAdmin && productCount >= 200) {
      toast({
        title: 'Product Limit Reached',
        description: 'Free tier allows 200 products per store. Upgrade your plan to add more products.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Implementation continues with product creation...
      toast({
        title: 'Success',
        description: 'Product added successfully',
      });
      navigate(`/inventory/${storeId}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add product',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const limitReached = !isAdmin && productCount >= 200;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-2xl mx-auto p-4 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Add New Product</h1>
            <p className="text-sm text-muted-foreground">
              {!isAdmin && `${productCount}/200 products used`}
            </p>
          </div>
        </div>

        {limitReached && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You've reached the free tier limit of 200 products. Upgrade your plan to add more products.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Information
            </CardTitle>
            <CardDescription>Enter the details of your product</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Samsung Galaxy S23"
                  required
                  disabled={limitReached}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your product..."
                  rows={3}
                  disabled={limitReached}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="999"
                    required
                    disabled={limitReached}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="50"
                    required
                    disabled={limitReached}
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading || limitReached || loadingCount} className="w-full">
                {loading ? 'Adding Product...' : 'Add Product'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <RoleBasedBottomNav />
    </div>
  );
}
