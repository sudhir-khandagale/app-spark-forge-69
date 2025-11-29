import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Minus, Package, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Search } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RoleBasedBottomNav from '@/components/RoleBasedBottomNav';

interface InventoryItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  low_stock_threshold: number;
  last_updated: string;
  products: {
    id: string;
    name: string;
    category: string | null;
    image_url: string | null;
  };
}

export default function LiveInventory() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchInventory();
    
    // Real-time subscription
    const channel = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory',
          filter: `store_id=eq.${storeId}`
        },
        () => {
          fetchInventory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId]);

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          products (
            id,
            name,
            category,
            image_url
          )
        `)
        .eq('store_id', storeId)
        .order('last_updated', { ascending: false });

      if (error) throw error;
      setInventory(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load inventory',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (inventoryId: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    setUpdatingId(inventoryId);

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
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update stock',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.products.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'low' ? item.quantity > 0 && item.quantity <= item.low_stock_threshold :
      filter === 'out' ? item.quantity === 0 : true;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: inventory.length,
    inStock: inventory.filter(i => i.quantity > i.low_stock_threshold).length,
    lowStock: inventory.filter(i => i.quantity > 0 && i.quantity <= i.low_stock_threshold).length,
    outOfStock: inventory.filter(i => i.quantity === 0).length,
    healthScore: inventory.length > 0 
      ? Math.round((inventory.filter(i => i.quantity > i.low_stock_threshold).length / inventory.length) * 100)
      : 100
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container max-w-4xl mx-auto p-4 space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Live Inventory</h1>
              <p className="text-sm text-muted-foreground">Real-time stock management</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto p-4 space-y-6">
        {/* Inventory Health Dashboard */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Inventory Health
            </CardTitle>
            <CardDescription>Overall stock status at a glance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Health Score</span>
              <span className={`text-2xl font-bold ${stats.healthScore >= 80 ? 'text-green-600' : stats.healthScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                {stats.healthScore}%
              </span>
            </div>
            <Progress value={stats.healthScore} className="h-3" />
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
              <div className="text-center space-y-1">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total Products</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-2xl font-bold text-green-600">{stats.inStock}</div>
                <div className="text-xs text-muted-foreground">In Stock</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-2xl font-bold text-yellow-600">{stats.lowStock}</div>
                <div className="text-xs text-muted-foreground">Low Stock</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
                <div className="text-xs text-muted-foreground">Out of Stock</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="low">Low ({stats.lowStock})</TabsTrigger>
            <TabsTrigger value="out">Out ({stats.outOfStock})</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="space-y-3 mt-6">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading inventory...</div>
            ) : filteredInventory.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No products found matching your search' : 'No products in this category'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredInventory.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {item.products.image_url && (
                        <img 
                          src={item.products.image_url} 
                          alt={item.products.name}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{item.products.name}</h3>
                        {item.products.category && (
                          <p className="text-xs text-muted-foreground">{item.products.category}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={
                            item.quantity === 0 ? 'destructive' :
                            item.quantity <= item.low_stock_threshold ? 'outline' : 'default'
                          } className="text-xs">
                            {item.quantity === 0 ? (
                              <><AlertCircle className="h-3 w-3 mr-1" /> Out of Stock</>
                            ) : item.quantity <= item.low_stock_threshold ? (
                              <><TrendingDown className="h-3 w-3 mr-1" /> Low Stock</>
                            ) : (
                              <><CheckCircle className="h-3 w-3 mr-1" /> In Stock</>
                            )}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(item.last_updated).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <div className="text-right">
                          <div className="text-2xl font-bold">{item.quantity}</div>
                          <div className="text-xs text-muted-foreground">units</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => updateStock(item.id, item.quantity - 1)}
                            disabled={updatingId === item.id || item.quantity === 0}
                            className="h-9 w-9"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => updateStock(item.id, item.quantity + 1)}
                            disabled={updatingId === item.id}
                            className="h-9 w-9"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <RoleBasedBottomNav />
    </div>
  );
}
