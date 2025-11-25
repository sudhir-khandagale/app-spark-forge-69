import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Share2, Trash2, Search } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import BottomNav from '@/components/BottomNav';

interface ListItem {
  id: string;
  product_name: string;
  quantity: number;
  checked: boolean;
  product_id: string | null;
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

  useEffect(() => {
    if (listId) {
      fetchListDetails();
    }
  }, [listId]);

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
              <div
                key={item.id}
                className={`flex items-center gap-3 p-3 bg-card border border-border rounded-lg transition-opacity ${
                  item.checked ? 'opacity-60' : ''
                }`}
              >
                <Checkbox
                  checked={item.checked}
                  onCheckedChange={() => handleToggleItem(item.id, item.checked)}
                />
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      item.checked ? 'line-through text-muted-foreground' : ''
                    }`}
                  >
                    {item.product_name}
                  </p>
                  {item.quantity > 1 && (
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/search?q=${encodeURIComponent(item.product_name)}`)}
                >
                  <Search className="h-4 w-4 mr-1" />
                  Find
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDeleteItem(item.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Action Button */}
      {uncheckedCount > 0 && (
        <div className="p-4 border-t border-border bg-background">
          <div className="max-w-lg mx-auto">
            <Button className="w-full" size="lg" onClick={handleFindAllItems}>
              <Search className="w-5 h-5 mr-2" />
              Find Items Nearby
            </Button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default ListDetails;
