import { useState, useEffect } from 'react';
import { Plus, MoreVertical, Trash2, Share2, Edit } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import BottomNav from '@/components/BottomNav';
import { PullToRefresh } from '@/components/PullToRefresh';

interface ShoppingList {
  id: string;
  name: string;
  created_at: string;
  shared: boolean;
  items?: {
    id: string;
    checked: boolean;
  }[];
}

const Lists = () => {
  const navigate = useNavigate();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleteListId, setDeleteListId] = useState<string | null>(null);

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async (): Promise<void> => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('shopping_lists')
        .select(`
          *,
          shopping_list_items (
            id,
            checked
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLists(data || []);
    } catch (error) {
      console.error('Error fetching lists:', error);
      toast({
        title: 'Error',
        description: 'Failed to load shopping lists',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a list name',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('shopping_lists')
        .insert([
          {
            name: newListName.trim(),
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Shopping list created',
      });

      setIsCreateOpen(false);
      setNewListName('');
      fetchLists();
    } catch (error) {
      console.error('Error creating list:', error);
      toast({
        title: 'Error',
        description: 'Failed to create shopping list',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteList = async (listId: string) => {
    try {
      const { error } = await supabase
        .from('shopping_lists')
        .delete()
        .eq('id', listId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Shopping list deleted',
      });

      fetchLists();
    } catch (error) {
      console.error('Error deleting list:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete shopping list',
        variant: 'destructive',
      });
    } finally {
      setDeleteListId(null);
    }
  };

  const getListStats = (list: ShoppingList) => {
    const items = list.items || [];
    const totalItems = items.length;
    const checkedItems = items.filter((item) => item.checked).length;
    return { totalItems, checkedItems };
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen pb-16">
        <header className="p-4 border-b border-border">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-10 rounded-md" />
          </div>
        </header>
        <main className="flex-1 p-4">
          <div className="max-w-lg mx-auto space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-16">
      {/* Header */}
      <header className="p-4 border-b border-border">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">Shopping Lists</h1>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="icon">
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Shopping List</DialogTitle>
                <DialogDescription>
                  Create a new shopping list to organize your items
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="list-name">List Name</Label>
                  <Input
                    id="list-name"
                    placeholder="e.g., Weekly Groceries"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateList();
                      }
                    }}
                  />
                </div>
                <Button
                  onClick={handleCreateList}
                  disabled={creating}
                  className="w-full"
                >
                  {creating ? 'Creating...' : 'Create List'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <PullToRefresh onRefresh={fetchLists}>
        {/* Lists */}
        <main className="flex-1 p-4">
          <div className="max-w-lg mx-auto space-y-3">
          {lists.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No shopping lists yet. Create your first one!
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create List
              </Button>
            </div>
          ) : (
            lists.map((list) => {
              const { totalItems, checkedItems } = getListStats(list);
              return (
                <div
                  key={list.id}
                  className="p-4 bg-card border border-border rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <Link to={`/lists/${list.id}`} className="flex-1">
                      <h3 className="font-semibold hover:text-primary transition-colors">
                        {list.name}
                      </h3>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => navigate(`/lists/${list.id}`)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteListId(list.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Link to={`/lists/${list.id}`}>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        {totalItems} {totalItems === 1 ? 'item' : 'items'}
                      </span>
                      {totalItems > 0 && (
                        <span className="text-accent font-medium">
                          {checkedItems}/{totalItems} checked
                        </span>
                      )}
                    </div>
                    {totalItems > 0 && (
                      <div className="mt-3">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-accent h-2 rounded-full transition-all"
                            style={{
                              width: `${(checkedItems / totalItems) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </Link>
                </div>
              );
            })
          )}
          </div>
        </main>
      </PullToRefresh>

      <AlertDialog
        open={deleteListId !== null}
        onOpenChange={(open) => !open && setDeleteListId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shopping List</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this shopping list? This action
              cannot be undone and will remove all items in the list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteListId && handleDeleteList(deleteListId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
};

export default Lists;
