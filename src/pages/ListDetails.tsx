import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Share2, Trash2, Search, Minus, Store, TrendingUp } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import BottomNav from '@/components/BottomNav';
import { Card } from '@/components/ui/card';

interface ListItem {
  id: string;
  product_name: string;
  quantity: number;
  checked: boolean;
  product_id: string | null;
  storeAvailability?: Array<{
    store_id: string;
    store_name: string;
    price: number;
    in_stock: boolean;
    quantity: number;
  }>;
}

interface ShoppingList {
  id: string;
  name: string;
  shared: boolean;
}

const ListDetails = () => {
  const { listId } = useParams();
  const navigate = useNavigate();
  const [list, setList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemName, setNewItemName] = useState('');
  const [adding, setAdding] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  useEffect(() => {
    if (listId) {
      fetchListDetails();
    }
  }, [listId]);

  useEffect(() => {
    if (items.length > 0) {
      fetchStoreAvailability();
    }
  }, [items.length]);

  const fetchListDetails = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Fetch list details
      const { data: listData, error: listError } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('id', listId)
        .single();

      if (listError) throw listError;
      setList(listData);

      // Fetch list items
      const { data: itemsData, error: itemsError } = await supabase
        .from('shopping_list_items')
        .select('*')
        .eq('list_id', listId)
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;
      setItems(itemsData || []);
    } catch (error) {
      console.error('Error fetching list details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load list details',
        variant: 'destructive',
      });
      navigate('/lists');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter an item name',
        variant: 'destructive',
      });
      return;
    }

    setAdding(true);
    try {
      const { error } = await supabase
        .from('shopping_list_items')
        .insert([
          {
            list_id: listId,
            product_name: newItemName.trim(),
            quantity: 1,
          },
        ]);

      if (error) throw error;

      setNewItemName('');
      fetchListDetails();
      
      toast({
        title: 'Success',
        description: 'Item added to list',
      });
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: 'Error',
        description: 'Failed to add item',
        variant: 'destructive',
      });
    } finally {
      setAdding(false);
    }
  };

  const handleToggleItem = async (itemId: string, currentChecked: boolean) => {
    try {
      const { error } = await supabase
        .from('shopping_list_items')
        .update({ checked: !currentChecked })
        .eq('id', itemId);

      if (error) throw error;

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, checked: !currentChecked } : item
        )
      );
    } catch (error) {
      console.error('Error toggling item:', error);
      toast({
        title: 'Error',
        description: 'Failed to update item',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('shopping_list_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setItems((prev) => prev.filter((item) => item.id !== itemId));
      
      toast({
        title: 'Success',
        description: 'Item removed from list',
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove item',
        variant: 'destructive',
      });
    }
  };

  const fetchStoreAvailability = async () => {
    setLoadingAvailability(true);
    try {
      // Batch product search to reduce API calls
      const productNames = items.map(item => item.product_name);
      
      // Use Promise.allSettled to prevent one failure from breaking all
      const results = await Promise.allSettled(
        items.map(async (item) => {
          // Search for products matching the item name
          const { data: products } = await supabase
            .from('products')
            .select('id, name')
            .ilike('name', `%${item.product_name}%`)
            .limit(1);

          if (!products || products.length === 0) {
            return { ...item, storeAvailability: [] };
          }

          const productId = products[0].id;

          // Get inventory for this product with fewer fields
          const { data: inventory } = await supabase
            .from('inventory')
            .select('store_id, price, quantity, stores!inner(name)')
            .eq('product_id', productId)
            .eq('in_stock', true)
            .gt('quantity', 0)
            .limit(3); // Reduced from 5 to 3 for better performance

          const availability = inventory?.map((inv: any) => ({
            store_id: inv.store_id,
            store_name: inv.stores.name,
            price: inv.price,
            in_stock: true,
            quantity: inv.quantity,
          })) || [];

          return { ...item, storeAvailability: availability };
        })
      );

      // Map results, handling both fulfilled and rejected promises
      const itemsWithAvailability = results.map((result, index) => 
        result.status === 'fulfilled' ? result.value : { ...items[index], storeAvailability: [] }
      );

      setItems(itemsWithAvailability);
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const { error } = await supabase
        .from('shopping_list_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId);

      if (error) throw error;

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: 'Error',
        description: 'Failed to update quantity',
        variant: 'destructive',
      });
    }
  };

  const handleFindOptimalStores = () => {
    const uncheckedItems = items.filter((item) => !item.checked);
    if (uncheckedItems.length === 0) {
      toast({
        title: 'All Done!',
        description: 'All items are checked off',
      });
      return;
    }

    // Count items available per store
    const storeItemCount = new Map<string, { count: number; name: string }>();
    
    uncheckedItems.forEach((item) => {
      item.storeAvailability?.forEach((store) => {
        const current = storeItemCount.get(store.store_id) || { count: 0, name: store.store_name };
        storeItemCount.set(store.store_id, { count: current.count + 1, name: store.store_name });
      });
    });

    if (storeItemCount.size === 0) {
      toast({
        title: 'No Stores Found',
        description: 'No stores have these items in stock',
        variant: 'destructive',
      });
      return;
    }

    // Find store with most items
    let bestStore = { id: '', name: '', count: 0 };
    storeItemCount.forEach((value, key) => {
      if (value.count > bestStore.count) {
        bestStore = { id: key, name: value.name, count: value.count };
      }
    });

    toast({
      title: 'Best Store Found!',
      description: `${bestStore.name} has ${bestStore.count} of ${uncheckedItems.length} items`,
    });

    navigate(`/store/${bestStore.id}`);
  };

  const handleFindAllItems = () => {
    const uncheckedItems = items.filter((item) => !item.checked);
    if (uncheckedItems.length === 0) {
      toast({
        title: 'All Done!',
        description: 'All items are checked off',
      });
      return;
    }

    // Get the first unchecked item and search for it
    const firstItem = uncheckedItems[0];
    navigate(`/search?q=${encodeURIComponent(firstItem.product_name)}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen pb-16">
        <header className="sticky top-0 z-40 bg-background border-b border-border">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-10 w-10" />
            </div>
            <Skeleton className="h-8 w-64" />
          </div>
        </header>
        <div className="p-4 border-b border-border">
          <div className="max-w-lg mx-auto flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
        <main className="flex-1 p-4">
          <div className="max-w-lg mx-auto space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (!list) {
    return (
      <div className="flex flex-col min-h-screen pb-16">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">List not found</p>
            <Button onClick={() => navigate('/lists')}>Back to Lists</Button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  const uncheckedCount = items.filter((item) => !item.checked).length;

  return (
    <div className="flex flex-col min-h-screen pb-16">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Link to="/lists">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              {uncheckedCount > 0 && (
                <Badge variant="secondary">{uncheckedCount} remaining</Badge>
              )}
            </div>
          </div>
          <h1 className="text-2xl font-bold">{list.name}</h1>
        </div>
      </header>

      {/* Add Item */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="max-w-lg mx-auto flex gap-2">
          <Input
            placeholder="Add item to list..."
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddItem();
              }
            }}
            disabled={adding}
          />
          <Button size="icon" onClick={handleAddItem} disabled={adding}>
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* List Items */}
      <main className="flex-1 p-4">
        <div className="max-w-lg mx-auto space-y-2">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No items in this list yet. Add your first item above!
              </p>
            </div>
          ) : (
            items.map((item) => (
              <Card
                key={item.id}
                className={`p-4 transition-opacity ${
                  item.checked ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={item.checked}
                    onCheckedChange={() => handleToggleItem(item.id, item.checked)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`font-medium ${
                          item.checked ? 'line-through text-muted-foreground' : ''
                        }`}
                      >
                        {item.product_name}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 -mt-1"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Qty:</span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Store Availability */}
                    {item.storeAvailability && item.storeAvailability.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Store className="h-3 w-3" />
                          Available at {item.storeAvailability.length} store(s)
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {item.storeAvailability.slice(0, 3).map((store) => (
                            <Badge
                              key={store.store_id}
                              variant="secondary"
                              className="text-xs cursor-pointer hover:bg-secondary/80"
                              onClick={() => navigate(`/store/${store.store_id}`)}
                            >
                              {store.store_name} - ₹{store.price}
                            </Badge>
                          ))}
                          {item.storeAvailability.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{item.storeAvailability.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    {item.storeAvailability && item.storeAvailability.length === 0 && !loadingAvailability && (
                      <p className="text-xs text-destructive">Not available nearby</p>
                    )}

                    {/* Find Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => navigate(`/search?q=${encodeURIComponent(item.product_name)}`)}
                    >
                      <Search className="h-3 w-3 mr-1" />
                      Find Product
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </main>

      {/* Action Buttons */}
      {uncheckedCount > 0 && (
        <div className="p-4 border-t border-border bg-background space-y-2">
          <div className="max-w-lg mx-auto space-y-2">
            <Button 
              className="w-full" 
              size="lg" 
              onClick={handleFindOptimalStores}
              disabled={loadingAvailability}
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              Find Best Store for All Items
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              size="lg" 
              onClick={handleFindAllItems}
            >
              <Search className="w-5 h-5 mr-2" />
              Search Individual Items
            </Button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default ListDetails;
