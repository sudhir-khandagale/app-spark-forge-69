import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Package, AlertCircle, Crown } from 'lucide-react';
import { useVendorSubscription } from '@/hooks/useVendorSubscription';
import { Alert, AlertDescription } from '@/components/ui/alert';
import RoleBasedBottomNav from '@/components/RoleBasedBottomNav';

export default function AddProduct() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const { subscription, loading: subLoading } = useVendorSubscription(userId, storeId);

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
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check tier-based product limit
    if (subscription && !subscription.isAdmin) {
      const productLimit = subscription.productLimits[subscription.tier];
      if (subscription.productCount >= productLimit) {
        const nextTier = subscription.tier === 'free' ? 'Pro (200 products)' : subscription.tier === 'pro' ? 'Premium (500 products)' : null;
        toast({
          title: 'Product Limit Reached',
          description: nextTier 
            ? `${subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)} tier allows ${productLimit} products per store. Upgrade to ${nextTier} to add more products.`
            : `You've reached the maximum of ${productLimit} products per store.`,
          variant: 'destructive',
        });
        return;
      }
    }

    setLoading(true);
    try {
      // Create product via edge function
      const { data, error } = await supabase.functions.invoke('store-dashboard', {
        body: {
          action: 'create_product',
          storeId,
          productData: {
            name: formData.name,
            description: formData.description || null,
            category: formData.category || null,
            price: parseFloat(formData.price),
            quantity: parseInt(formData.quantity),
            barcode: formData.barcode || null,
            lowStockThreshold: parseInt(formData.lowStockThreshold),
          }
        }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Product added successfully',
      });
      navigate(`/inventory/${storeId}`);
    } catch (error: any) {
      console.error('Add product error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add product',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const limitReached = subscription && !subscription.isAdmin && subscription.productCount >= subscription.productLimits[subscription.tier];
  const productLimit = subscription?.productLimits[subscription.tier] || 100;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-2xl mx-auto p-4 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Add New Product</h1>
            {subscription && !subLoading && (
              <p className="text-sm text-muted-foreground">
                {subscription.productCount}/{productLimit} products used
              </p>
            )}
          </div>
        </div>

        {limitReached && subscription && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                You've reached the {subscription.tier} tier limit of {productLimit} products per store.
              </span>
              {subscription.tier !== 'premium' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => navigate('/profile')}
                >
                  <Crown className="w-3 h-3 mr-1" />
                  Upgrade
                </Button>
              )}
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

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Electronics, Fashion, Food"
                  disabled={limitReached}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
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

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="Optional barcode"
                    disabled={limitReached}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lowStockThreshold">Low Stock Alert</Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    value={formData.lowStockThreshold}
                    onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                    placeholder="10"
                    disabled={limitReached}
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading || limitReached || subLoading} className="w-full">
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
