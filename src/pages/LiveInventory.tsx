import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Minus, Package, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Search, Scan, Download, Edit2, Check, X, Filter } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { InventoryScanner } from '@/components/InventoryScanner';
import RoleBasedBottomNav from '@/components/RoleBasedBottomNav';
import { InventoryAssistant } from '@/components/InventoryAssistant';
import { InventoryOCRUpload } from '@/components/InventoryOCRUpload';
import { SmartInventorySearch } from '@/components/SmartInventorySearch';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  
  // Edit modes
  const [editingQuantity, setEditingQuantity] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [editingThreshold, setEditingThreshold] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  
  // Temp values for editing
  const [tempQuantity, setTempQuantity] = useState('');
  const [tempPrice, setTempPrice] = useState('');
  const [tempThreshold, setTempThreshold] = useState('');
  const [tempCategory, setTempCategory] = useState('');
  
  // Success animation state
  const [successId, setSuccessId] = useState<string | null>(null);

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

      // Trigger success animation
      setSuccessId(inventoryId);
      setTimeout(() => setSuccessId(null), 600);

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

  const updatePrice = async (inventoryId: string, newPrice: number) => {
    if (newPrice < 0) return;

    try {
      const { error } = await supabase
        .from('inventory')
        .update({ price: newPrice })
        .eq('id', inventoryId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Price updated',
      });
      fetchInventory();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update price',
        variant: 'destructive',
      });
    }
  };

  const updateThreshold = async (inventoryId: string, newThreshold: number) => {
    if (newThreshold < 0) return;

    try {
      const { error } = await supabase
        .from('inventory')
        .update({ low_stock_threshold: newThreshold })
        .eq('id', inventoryId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Low stock threshold updated',
      });
      fetchInventory();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update threshold',
        variant: 'destructive',
      });
    }
  };

  const updateCategory = async (productId: string, newCategory: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ category: newCategory })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Category updated',
      });
      fetchInventory();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update category',
        variant: 'destructive',
      });
    }
  };

  const exportToCSV = () => {
    const csvData = filteredInventory.map(item => ({
      'Product Name': item.products.name,
      'Category': item.products.category || 'Uncategorized',
      'Current Stock': item.quantity,
      'Price': item.price,
      'Low Stock Threshold': item.low_stock_threshold,
      'Status': item.quantity === 0 ? 'Out of Stock' : item.quantity <= item.low_stock_threshold ? 'Low Stock' : 'In Stock',
      'Last Updated': new Date(item.last_updated).toLocaleString(),
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: `Exported ${csvData.length} products to CSV`,
    });
  };

  const categories = Array.from(new Set(inventory.map(i => i.products.category).filter(Boolean))) as string[];

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.products.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'low' ? item.quantity > 0 && item.quantity <= item.low_stock_threshold :
      filter === 'out' ? item.quantity === 0 : true;
    const matchesCategory = categoryFilter === 'all' || item.products.category === categoryFilter;
    return matchesSearch && matchesFilter && matchesCategory;
  });

  const stats = {
    total: inventory.length,
    inStock: inventory.filter(i => i.quantity > i.low_stock_threshold).length,
    lowStock: inventory.filter(i => i.quantity > 0 && i.quantity <= i.low_stock_threshold).length,
    outOfStock: inventory.filter(i => i.quantity === 0).length,
    healthScore: inventory.length > 0 
      ? Math.round((inventory.filter(i => i.quantity > i.low_stock_threshold).length / inventory.length) * 100)
      : 100,
    totalValue: inventory.reduce((sum, item) => sum + (item.quantity * item.price), 0)
  };

  const startEditQuantity = (item: InventoryItem) => {
    setEditingQuantity(item.id);
    setTempQuantity(item.quantity.toString());
  };

  const saveQuantity = (inventoryId: string) => {
    const qty = parseInt(tempQuantity);
    if (!isNaN(qty) && qty >= 0) {
      updateStock(inventoryId, qty);
    }
    setEditingQuantity(null);
  };

  const startEditPrice = (item: InventoryItem) => {
    setEditingPrice(item.id);
    setTempPrice(item.price.toString());
  };

  const savePrice = (inventoryId: string) => {
    const price = parseFloat(tempPrice);
    if (!isNaN(price) && price >= 0) {
      updatePrice(inventoryId, price);
    }
    setEditingPrice(null);
  };

  const startEditThreshold = (item: InventoryItem) => {
    setEditingThreshold(item.id);
    setTempThreshold(item.low_stock_threshold.toString());
  };

  const saveThreshold = (inventoryId: string) => {
    const threshold = parseInt(tempThreshold);
    if (!isNaN(threshold) && threshold >= 0) {
      updateThreshold(inventoryId, threshold);
    }
    setEditingThreshold(null);
  };

  const startEditCategory = (item: InventoryItem) => {
    setEditingCategory(item.id);
    setTempCategory(item.products.category || '');
  };

  const saveCategory = (productId: string) => {
    if (tempCategory.trim()) {
      updateCategory(productId, tempCategory.trim());
    }
    setEditingCategory(null);
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
            <Button onClick={() => setScannerOpen(true)} variant="outline" size="sm">
              <Scan className="h-4 w-4 mr-2" />
              Scan
            </Button>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <SmartInventorySearch
            onSearch={setSearchQuery}
            onFilterChange={setFilter as any}
            currentFilter={filter}
          />

          <div className="flex gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <InventoryOCRUpload
              storeId={storeId || ''}
              onUploadComplete={fetchInventory}
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
            
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Stock Value</span>
                <span className="text-xl font-bold">₹{stats.totalValue.toLocaleString()}</span>
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
                    <div className="space-y-3">
                      <div className="flex gap-4">
                        {item.products.image_url && (
                          <img 
                            src={item.products.image_url} 
                            alt={item.products.name}
                            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{item.products.name}</h3>
                          
                          {/* Category */}
                          <div className="mt-1">
                            {editingCategory === item.id ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  value={tempCategory}
                                  onChange={(e) => setTempCategory(e.target.value)}
                                  className="h-7 text-xs"
                                  placeholder="Category"
                                  autoFocus
                                />
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveCategory(item.products.id)}>
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingCategory(null)}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <button onClick={() => startEditCategory(item)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                                {item.products.category || 'No category'}
                                <Edit2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>

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
                            <span className="text-xs text-muted-foreground">
                              {new Date(item.last_updated).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Stock, Price, Threshold Controls - Enhanced */}
                      <div className="space-y-3 pt-4 border-t">
                        {/* Stock Row */}
                        <motion.div 
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border"
                          animate={successId === item.id ? { 
                            boxShadow: ['0 0 0 0 rgba(16, 185, 129, 0)', '0 0 0 8px rgba(16, 185, 129, 0.3)', '0 0 0 0 rgba(16, 185, 129, 0)']
                          } : {}}
                          transition={{ duration: 0.6 }}
                        >
                          <Label className="text-sm font-medium min-w-[60px]">Stock</Label>
                          <AnimatePresence mode="wait">
                            {editingQuantity === item.id ? (
                              <motion.div 
                                key="editing"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex items-center gap-2 flex-1 justify-end"
                              >
                                <Input
                                  type="number"
                                  value={tempQuantity}
                                  onChange={(e) => setTempQuantity(e.target.value)}
                                  className="h-12 text-base max-w-[100px]"
                                  autoFocus
                                />
                                <Button 
                                  size="icon" 
                                  variant="default" 
                                  className="h-11 w-11" 
                                  onClick={() => saveQuantity(item.id)}
                                >
                                  <Check className="h-5 w-5" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-11 w-11" 
                                  onClick={() => setEditingQuantity(null)}
                                >
                                  <X className="h-5 w-5" />
                                </Button>
                              </motion.div>
                            ) : (
                              <motion.div 
                                key="display"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex items-center gap-2"
                              >
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => updateStock(item.id, item.quantity - 1)}
                                  disabled={updatingId === item.id || item.quantity === 0}
                                  className="h-11 w-11 hover:bg-destructive/10 hover:border-destructive"
                                >
                                  <Minus className="h-5 w-5" />
                                </Button>
                                <motion.span
                                  key={item.quantity}
                                  initial={{ scale: 1.2, color: '#10b981' }}
                                  animate={{ scale: 1, color: 'inherit' }}
                                  transition={{ duration: 0.3 }}
                                  className="text-2xl font-bold min-w-[60px] text-center"
                                >
                                  {item.quantity}
                                </motion.span>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => updateStock(item.id, item.quantity + 1)}
                                  disabled={updatingId === item.id}
                                  className="h-11 w-11 hover:bg-primary/10 hover:border-primary"
                                >
                                  <Plus className="h-5 w-5" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-11 w-11"
                                  onClick={() => startEditQuantity(item)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>

                        {/* Price Row */}
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                          <Label className="text-sm font-medium min-w-[60px]">Price</Label>
                          <AnimatePresence mode="wait">
                            {editingPrice === item.id ? (
                              <motion.div 
                                key="editing"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex items-center gap-2 flex-1 justify-end"
                              >
                                <Input
                                  type="number"
                                  value={tempPrice}
                                  onChange={(e) => setTempPrice(e.target.value)}
                                  className="h-12 text-base max-w-[100px]"
                                  autoFocus
                                />
                                <Button 
                                  size="icon" 
                                  variant="default" 
                                  className="h-11 w-11" 
                                  onClick={() => savePrice(item.id)}
                                >
                                  <Check className="h-5 w-5" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-11 w-11" 
                                  onClick={() => setEditingPrice(null)}
                                >
                                  <X className="h-5 w-5" />
                                </Button>
                              </motion.div>
                            ) : (
                              <motion.div 
                                key="display"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex items-center gap-2"
                              >
                                <span className="text-xl font-bold">₹{item.price}</span>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-11 w-11"
                                  onClick={() => startEditPrice(item)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Threshold Row */}
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                          <Label className="text-sm font-medium min-w-[60px]">Alert at</Label>
                          <AnimatePresence mode="wait">
                            {editingThreshold === item.id ? (
                              <motion.div 
                                key="editing"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex items-center gap-2 flex-1 justify-end"
                              >
                                <Input
                                  type="number"
                                  value={tempThreshold}
                                  onChange={(e) => setTempThreshold(e.target.value)}
                                  className="h-12 text-base max-w-[100px]"
                                  autoFocus
                                />
                                <Button 
                                  size="icon" 
                                  variant="default" 
                                  className="h-11 w-11" 
                                  onClick={() => saveThreshold(item.id)}
                                >
                                  <Check className="h-5 w-5" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-11 w-11" 
                                  onClick={() => setEditingThreshold(null)}
                                >
                                  <X className="h-5 w-5" />
                                </Button>
                              </motion.div>
                            ) : (
                              <motion.div 
                                key="display"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex items-center gap-2"
                              >
                                <span className="text-xl font-bold">{item.low_stock_threshold}</span>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-11 w-11"
                                  onClick={() => startEditThreshold(item)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </motion.div>
                            )}
                          </AnimatePresence>
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

      <InventoryScanner 
        open={scannerOpen} 
        onOpenChange={setScannerOpen}
        storeId={storeId!}
        onStockUpdated={fetchInventory}
      />

      <InventoryAssistant
        storeId={storeId || ''}
        onInventoryUpdate={fetchInventory}
      />

      <RoleBasedBottomNav />
    </div>
  );
}
