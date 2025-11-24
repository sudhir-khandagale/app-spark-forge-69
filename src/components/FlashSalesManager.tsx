import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Zap, Plus, Clock, Trash2, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface FlashSalesManagerProps {
  storeId: string;
}

interface FlashSale {
  id: string;
  product_id: string;
  original_price: number;
  sale_price: number;
  discount_percentage: number;
  starts_at: string;
  ends_at: string;
  max_quantity: number | null;
  sold_quantity: number;
  active: boolean;
  products: {
    name: string;
  };
}

export default function FlashSalesManager({ storeId }: FlashSalesManagerProps) {
  const { toast } = useToast();
  const [sales, setSales] = useState<FlashSale[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [formData, setFormData] = useState({
    product_id: '',
    sale_price: '',
    starts_at: '',
    ends_at: '',
    max_quantity: ''
  });

  useEffect(() => {
    fetchData();
  }, [storeId]);

  const fetchData = async () => {
    try {
      const [salesRes, productsRes] = await Promise.all([
        supabase
          .from('flash_sales')
          .select(`
            *,
            products (name)
          `)
          .eq('store_id', storeId)
          .order('created_at', { ascending: false }),
        supabase
          .from('inventory')
          .select(`
            product_id,
            price,
            products (id, name)
          `)
          .eq('store_id', storeId)
          .eq('in_stock', true)
      ]);

      if (salesRes.error) throw salesRes.error;
      if (productsRes.error) throw productsRes.error;

      setSales(salesRes.data || []);
      setProducts(productsRes.data?.map((inv: any) => ({
        id: inv.products.id,
        name: inv.products.name,
        price: inv.price
      })) || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setCreating(true);

      const product = products.find(p => p.id === formData.product_id);
      if (!product) throw new Error('Product not found');

      const salePrice = parseFloat(formData.sale_price);
      if (salePrice >= product.price) {
        throw new Error('Sale price must be less than original price');
      }

      const { error } = await supabase
        .from('flash_sales')
        .insert({
          store_id: storeId,
          product_id: formData.product_id,
          original_price: product.price,
          sale_price: salePrice,
          starts_at: new Date(formData.starts_at).toISOString(),
          ends_at: new Date(formData.ends_at).toISOString(),
          max_quantity: formData.max_quantity ? parseInt(formData.max_quantity) : null
        });

      if (error) throw error;

      toast({
        title: 'Flash Sale Created',
        description: 'Your flash sale is now active'
      });

      setOpen(false);
      setFormData({
        product_id: '',
        sale_price: '',
        starts_at: '',
        ends_at: '',
        max_quantity: ''
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('flash_sales')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Flash Sale Deleted',
        description: 'The flash sale has been removed'
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const selectedProduct = products.find(p => p.id === formData.product_id);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle>Flash Sales</CardTitle>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Flash Sale
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Flash Sale</DialogTitle>
                <DialogDescription>Set up a limited-time discount on your products</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Product</Label>
                  <Select value={formData.product_id} onValueChange={(value) => setFormData({...formData, product_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {formatPrice(product.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedProduct && (
                  <div className="p-3 bg-muted rounded-lg space-y-2">
                    <p className="text-sm text-muted-foreground">Original Price</p>
                    <p className="text-2xl font-bold">{formatPrice(selectedProduct.price)}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Sale Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="199.99"
                    value={formData.sale_price}
                    onChange={(e) => setFormData({...formData, sale_price: e.target.value})}
                  />
                  {selectedProduct && formData.sale_price && (
                    <p className="text-sm text-green-600">
                      {Math.round(((selectedProduct.price - parseFloat(formData.sale_price)) / selectedProduct.price) * 100)}% OFF
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Starts At</Label>
                    <Input
                      type="datetime-local"
                      value={formData.starts_at}
                      onChange={(e) => setFormData({...formData, starts_at: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Ends At</Label>
                    <Input
                      type="datetime-local"
                      value={formData.ends_at}
                      onChange={(e) => setFormData({...formData, ends_at: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Max Quantity (Optional)</Label>
                  <Input
                    type="number"
                    placeholder="Unlimited"
                    value={formData.max_quantity}
                    onChange={(e) => setFormData({...formData, max_quantity: e.target.value})}
                  />
                </div>

                <Button onClick={handleCreate} disabled={creating || !formData.product_id || !formData.sale_price} className="w-full">
                  {creating ? 'Creating...' : 'Create Flash Sale'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>Limited-time offers to boost sales</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading...</p>
        ) : sales.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No flash sales yet. Create your first one!</p>
        ) : (
          <div className="space-y-3">
            {sales.map((sale) => {
              const isActive = sale.active && new Date() >= new Date(sale.starts_at) && new Date() <= new Date(sale.ends_at);
              const isPending = new Date() < new Date(sale.starts_at);
              const isExpired = new Date() > new Date(sale.ends_at);

              return (
                <div key={sale.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{sale.products.name}</h3>
                        {isActive && <Badge className="bg-green-600">Active</Badge>}
                        {isPending && <Badge variant="secondary">Scheduled</Badge>}
                        {isExpired && <Badge variant="outline">Ended</Badge>}
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground line-through">{formatPrice(sale.original_price)}</span>
                        <span className="text-xl font-bold text-primary">{formatPrice(sale.sale_price)}</span>
                        <Badge variant="destructive">
                          <Tag className="h-3 w-3 mr-1" />
                          {sale.discount_percentage}% OFF
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(sale.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {isPending ? (
                        <span>Starts {formatDistanceToNow(new Date(sale.starts_at), { addSuffix: true })}</span>
                      ) : isActive ? (
                        <span>Ends {formatDistanceToNow(new Date(sale.ends_at), { addSuffix: true })}</span>
                      ) : (
                        <span>Ended {formatDistanceToNow(new Date(sale.ends_at), { addSuffix: true })}</span>
                      )}
                    </div>
                    {sale.max_quantity && (
                      <span>{sale.sold_quantity}/{sale.max_quantity} sold</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
