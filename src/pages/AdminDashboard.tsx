import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Store, Users, ShoppingBag, CheckCircle, XCircle, Clock, Trash2, Eye, AlertCircle, Package, MapPin, Phone, Mail, Calendar, Image as ImageIcon } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface StoreDetails {
  id: string;
  name: string;
  address: string;
  owner_id: string;
  status: string;
  created_at: string;
  phone: string | null;
  email: string | null;
  photo_urls: string[] | null;
  specialties: string[] | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  owner_name: string | null;
  owner_email: string | null;
  owner_phone: string | null;
}

interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  role: string;
}

interface ProductWithStore {
  id: string;
  name: string;
  category: string | null;
  created_at: string;
  store_id: string;
  store_name: string;
  quantity: number;
  price: number;
  in_stock: boolean;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [pendingStores, setPendingStores] = useState<StoreDetails[]>([]);
  const [allStores, setAllStores] = useState<StoreDetails[]>([]);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [products, setProducts] = useState<ProductWithStore[]>([]);
  const [selectedStore, setSelectedStore] = useState<StoreDetails | null>(null);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate('/');
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access this page',
        variant: 'destructive',
      });
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      // Fetch pending stores with owner details
      const { data: pending, error: pendingError } = await supabase
        .from('stores')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (pendingError) throw pendingError;

      // Fetch owner details for pending stores
      const pendingWithOwners = await Promise.all(
        (pending || []).map(async (store) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, phone')
            .eq('id', store.owner_id)
            .single();

          const { data: { user } } = await supabase.auth.admin.getUserById(store.owner_id);

          return {
            ...store,
            owner_name: profile?.display_name || null,
            owner_email: user?.email || null,
            owner_phone: profile?.phone || null,
          };
        })
      );

      setPendingStores(pendingWithOwners);

      // Fetch all stores with owner details
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false });

      if (storesError) throw storesError;

      const allStoresWithOwners = await Promise.all(
        (stores || []).map(async (store) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, phone')
            .eq('id', store.owner_id)
            .single();

          const { data: { user } } = await supabase.auth.admin.getUserById(store.owner_id);

          return {
            ...store,
            owner_name: profile?.display_name || null,
            owner_email: user?.email || null,
            owner_phone: profile?.phone || null,
          };
        })
      );

      setAllStores(allStoresWithOwners);

      // Fetch users with roles
      const { data: usersData, error: usersError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (usersError) throw usersError;

      // Get user details from auth
      const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) throw authError;

      const usersWithRoles = authUsers.map(user => {
        const roleData = usersData?.find(r => r.user_id === user.id);
        return {
          id: user.id,
          email: user.email || '',
          created_at: user.created_at,
          role: roleData?.role || 'customer',
        };
      });

      setUsers(usersWithRoles);

      // Fetch products with store information
      const { data: productsData, error: productsError } = await supabase
        .from('inventory')
        .select(`
          id,
          quantity,
          price,
          in_stock,
          products (
            id,
            name,
            category,
            created_at
          ),
          stores (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      const formattedProducts = productsData?.map(item => ({
        id: item.products.id,
        name: item.products.name,
        category: item.products.category,
        created_at: item.products.created_at,
        store_id: item.stores.id,
        store_name: item.stores.name,
        quantity: item.quantity,
        price: item.price,
        in_stock: item.in_stock || false,
      })) || [];

      setProducts(formattedProducts);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveStore = async (storeId: string) => {
    try {
      const { error } = await supabase
        .from('stores')
        .update({ status: 'approved' })
        .eq('id', storeId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Store approved successfully',
      });

      fetchData();
    } catch (error: any) {
      console.error('Error approving store:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve store',
        variant: 'destructive',
      });
    }
  };

  const handleRejectStore = async (storeId: string) => {
    try {
      const { error } = await supabase
        .from('stores')
        .update({ status: 'rejected' })
        .eq('id', storeId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Store rejected',
      });

      fetchData();
    } catch (error: any) {
      console.error('Error rejecting store:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject store',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteStore = async (storeId: string) => {
    try {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', storeId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Store deleted successfully',
      });

      fetchData();
    } catch (error: any) {
      console.error('Error deleting store:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete store',
        variant: 'destructive',
      });
    }
  };

  const handleChangeStoreStatus = async (storeId: string, newStatus: 'pending' | 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('stores')
        .update({ status: newStatus })
        .eq('id', storeId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Store status changed to ${newStatus}`,
      });

      fetchData();
    } catch (error: any) {
      console.error('Error changing status:', error);
      toast({
        title: 'Error',
        description: 'Failed to change store status',
        variant: 'destructive',
      });
    }
  };

  const handleChangeUserRole = async (userId: string, newRole: 'customer' | 'vendor' | 'admin') => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User role updated',
      });

      fetchData();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      // First delete from inventory
      const { error: inventoryError } = await supabase
        .from('inventory')
        .delete()
        .eq('product_id', productId);

      if (inventoryError) throw inventoryError;

      // Then delete the product
      const { error: productError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (productError) throw productError;

      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });

      fetchData();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete product',
        variant: 'destructive',
      });
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage vendors, stores, and users</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingStores.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Stores</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allStores.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
            <TabsTrigger value="stores">All Stores</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

           <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Vendor Approvals</CardTitle>
                <CardDescription>Review and approve store registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Store Name</TableHead>
                      <TableHead>Vendor Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingStores.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No pending approvals
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingStores.map((store) => (
                        <TableRow key={store.id}>
                          <TableCell className="font-medium">{store.name}</TableCell>
                          <TableCell>{store.owner_name || 'N/A'}</TableCell>
                          <TableCell className="max-w-xs truncate">{store.address}</TableCell>
                          <TableCell>{new Date(store.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedStore(store)}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    View Details
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Vendor & Store Details</DialogTitle>
                                    <DialogDescription>
                                      Complete information for verification
                                    </DialogDescription>
                                  </DialogHeader>
                                  {selectedStore && (
                                    <div className="space-y-6">
                                      {/* Vendor Information */}
                                      <div className="space-y-3">
                                        <h3 className="text-lg font-semibold flex items-center gap-2">
                                          <Users className="h-5 w-5" />
                                          Vendor Information
                                        </h3>
                                        <div className="grid gap-3 p-4 bg-muted/50 rounded-lg">
                                          <div className="flex items-start gap-2">
                                            <span className="font-medium min-w-[120px]">Name:</span>
                                            <span>{selectedStore.owner_name || 'Not provided'}</span>
                                          </div>
                                          <div className="flex items-start gap-2">
                                            <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                            <span className="font-medium min-w-[120px]">Email:</span>
                                            <span>{selectedStore.owner_email || 'Not provided'}</span>
                                          </div>
                                          <div className="flex items-start gap-2">
                                            <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                            <span className="font-medium min-w-[120px]">Phone:</span>
                                            <span>{selectedStore.owner_phone || 'Not provided'}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Store Information */}
                                      <div className="space-y-3">
                                        <h3 className="text-lg font-semibold flex items-center gap-2">
                                          <Store className="h-5 w-5" />
                                          Store Information
                                        </h3>
                                        <div className="grid gap-3 p-4 bg-muted/50 rounded-lg">
                                          <div className="flex items-start gap-2">
                                            <span className="font-medium min-w-[120px]">Store Name:</span>
                                            <span className="font-semibold">{selectedStore.name}</span>
                                          </div>
                                          <div className="flex items-start gap-2">
                                            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                            <span className="font-medium min-w-[120px]">Address:</span>
                                            <span>{selectedStore.address}</span>
                                          </div>
                                          {selectedStore.phone && (
                                            <div className="flex items-start gap-2">
                                              <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                              <span className="font-medium min-w-[120px]">Store Phone:</span>
                                              <span>{selectedStore.phone}</span>
                                            </div>
                                          )}
                                          {selectedStore.email && (
                                            <div className="flex items-start gap-2">
                                              <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                              <span className="font-medium min-w-[120px]">Store Email:</span>
                                              <span>{selectedStore.email}</span>
                                            </div>
                                          )}
                                          {selectedStore.description && (
                                            <div className="flex items-start gap-2">
                                              <span className="font-medium min-w-[120px]">Description:</span>
                                              <span>{selectedStore.description}</span>
                                            </div>
                                          )}
                                          {selectedStore.specialties && selectedStore.specialties.length > 0 && (
                                            <div className="flex items-start gap-2">
                                              <span className="font-medium min-w-[120px]">Specialties:</span>
                                              <div className="flex flex-wrap gap-1">
                                                {selectedStore.specialties.map((specialty, idx) => (
                                                  <Badge key={idx} variant="secondary">{specialty}</Badge>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                          {(selectedStore.latitude && selectedStore.longitude) && (
                                            <div className="flex items-start gap-2">
                                              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                              <span className="font-medium min-w-[120px]">Coordinates:</span>
                                              <span>{selectedStore.latitude.toFixed(6)}, {selectedStore.longitude.toFixed(6)}</span>
                                            </div>
                                          )}
                                          <div className="flex items-start gap-2">
                                            <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                            <span className="font-medium min-w-[120px]">Registered:</span>
                                            <span>{new Date(selectedStore.created_at).toLocaleString()}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Store Photos */}
                                      {selectedStore.photo_urls && selectedStore.photo_urls.length > 0 && (
                                        <div className="space-y-3">
                                          <h3 className="text-lg font-semibold flex items-center gap-2">
                                            <ImageIcon className="h-5 w-5" />
                                            Store Photos
                                          </h3>
                                          <div className="grid grid-cols-2 gap-3">
                                            {selectedStore.photo_urls.map((url, idx) => (
                                              <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border">
                                                <img 
                                                  src={url} 
                                                  alt={`Store photo ${idx + 1}`}
                                                  className="object-cover w-full h-full"
                                                />
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Action Buttons */}
                                      <div className="flex gap-3 pt-4 border-t">
                                        <Button
                                          className="flex-1 bg-green-600 hover:bg-green-700"
                                          onClick={() => {
                                            handleApproveStore(selectedStore.id);
                                            setSelectedStore(null);
                                          }}
                                        >
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          Approve Store
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          className="flex-1"
                                          onClick={() => {
                                            handleRejectStore(selectedStore.id);
                                            setSelectedStore(null);
                                          }}
                                        >
                                          <XCircle className="h-4 w-4 mr-2" />
                                          Reject Store
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                              <Button
                                size="sm"
                                onClick={() => handleApproveStore(store.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectStore(store.id)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stores" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Stores</CardTitle>
                <CardDescription>View and manage all stores</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Store Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allStores.map((store) => (
                      <TableRow key={store.id}>
                        <TableCell className="font-medium">{store.name}</TableCell>
                        <TableCell className="max-w-xs truncate">{store.address}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {store.phone && <div>{store.phone}</div>}
                            {store.email && <div className="text-xs text-muted-foreground truncate max-w-[150px]">{store.email}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={store.status}
                            onValueChange={(value) => handleChangeStoreStatus(store.id, value as 'pending' | 'approved' | 'rejected')}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>{new Date(store.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/store/${store.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Store?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete "{store.name}" and all associated data. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteStore(store.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Product Management</CardTitle>
                <CardDescription>View and manage all products across stores</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Store</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          No products found
                        </TableCell>
                      </TableRow>
                    ) : (
                      products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>
                            {product.category ? (
                              <Badge variant="outline">{product.category}</Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">Uncategorized</span>
                            )}
                          </TableCell>
                          <TableCell>{product.store_name}</TableCell>
                          <TableCell>₹{product.price.toFixed(2)}</TableCell>
                          <TableCell>{product.quantity}</TableCell>
                          <TableCell>
                            {product.in_stock ? (
                              <Badge className="bg-green-100 text-green-800">In Stock</Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">Out of Stock</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/product/${product.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Product?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete "{product.name}" from {product.store_name}. This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteProduct(product.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user roles and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Current Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Change Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Select
                            defaultValue={user.role}
                            onValueChange={(value: string) => handleChangeUserRole(user.id, value as 'customer' | 'vendor' | 'admin')}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="customer">Customer</SelectItem>
                              <SelectItem value="vendor">Vendor</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
