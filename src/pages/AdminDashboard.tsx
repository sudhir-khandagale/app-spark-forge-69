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
import { Input } from '@/components/ui/input';
import { Store, Users, ShoppingBag, CheckCircle, XCircle, Clock, Trash2, Eye, AlertCircle, Package, MapPin, Phone, Mail, Calendar, Image as ImageIcon, ArrowLeft, Star, Plus, TrendingUp, DollarSign, BarChart3, Ban, UserX, Search } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

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
  rejection_reason: string | null;
  featured: boolean;
  commission_rate: number;
}

interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  role: string;
  display_name: string | null;
  phone: string | null;
  account_status: string;
  admin_notes: string | null;
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
  trending: boolean;
}

interface OrderDetails {
  id: string;
  created_at: string;
  total_amount: number;
  payment_status: string;
  delivery_status: string;
  store_id: string;
  store_name: string;
  user_id: string;
  user_email: string;
  items: any;
}

interface PlatformStats {
  totalRevenue: number;
  totalOrders: number;
  activeUsers: number;
  pendingOrders: number;
  totalCommission: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, user, loading: roleLoading } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [pendingStores, setPendingStores] = useState<StoreDetails[]>([]);
  const [rejectedStores, setRejectedStores] = useState<StoreDetails[]>([]);
  const [allStores, setAllStores] = useState<StoreDetails[]>([]);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [products, setProducts] = useState<ProductWithStore[]>([]);
  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    totalRevenue: 0,
    totalOrders: 0,
    activeUsers: 0,
    pendingOrders: 0,
    totalCommission: 0,
  });
  const [selectedStore, setSelectedStore] = useState<StoreDetails | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [storeToReject, setStoreToReject] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [revenueChartData, setRevenueChartData] = useState<any[]>([]);
  const [topStoresData, setTopStoresData] = useState<any[]>([]);

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
      await Promise.all([
        fetchStores(),
        fetchUsers(),
        fetchProducts(),
        fetchOrders(),
        fetchPlatformStats(),
        fetchAnalytics(),
      ]);
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

  const fetchStores = async () => {
    // Define explicit columns for admin view - excludes sensitive banking details
    // Banking info should only be accessed on dedicated payment/payout pages
    const storeColumns = 'id, name, address, phone, email, latitude, longitude, hours, description, rating, review_count, specialties, photo_urls, status, featured, offers_delivery, delivery_charges, cod_available, google_maps_link, owner_id, rejection_reason, commission_rate, created_at, updated_at';
    
    // Fetch pending stores
    const { data: pending, error: pendingError } = await supabase
      .from('stores')
      .select(storeColumns)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (pendingError) throw pendingError;

    const pendingWithOwners = await Promise.all(
      (pending || []).map(async (store) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, phone, email')
          .eq('id', store.owner_id)
          .single();

        return {
          ...store,
          owner_name: profile?.display_name || null,
          owner_email: profile?.email || null,
          owner_phone: profile?.phone || null,
        };
      })
    );

    setPendingStores(pendingWithOwners);

    // Fetch rejected stores
    const { data: rejected, error: rejectedError } = await supabase
      .from('stores')
      .select(storeColumns)
      .eq('status', 'rejected')
      .order('created_at', { ascending: false });

    if (rejectedError) throw rejectedError;

    const rejectedWithOwners = await Promise.all(
      (rejected || []).map(async (store) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, phone, email')
          .eq('id', store.owner_id)
          .single();

        return {
          ...store,
          owner_name: profile?.display_name || null,
          owner_email: profile?.email || null,
          owner_phone: profile?.phone || null,
        };
      })
    );

    setRejectedStores(rejectedWithOwners);

    // Fetch all stores
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select(storeColumns)
      .order('created_at', { ascending: false });

    if (storesError) throw storesError;

    const allStoresWithOwners = await Promise.all(
      (stores || []).map(async (store) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, phone, email')
          .eq('id', store.owner_id)
          .single();

        return {
          ...store,
          owner_name: profile?.display_name || null,
          owner_email: profile?.email || null,
          owner_phone: profile?.phone || null,
        };
      })
    );

    setAllStores(allStoresWithOwners);
  };

  const fetchUsers = async () => {
    const { data: usersData, error: usersError } = await supabase
      .from('user_roles')
      .select('user_id, role, created_at');

    if (usersError) throw usersError;

    const usersWithRoles = await Promise.all(
      (usersData || []).map(async (userRole) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, display_name, phone, created_at, account_status, admin_notes')
          .eq('id', userRole.user_id)
          .single();

        return {
          id: userRole.user_id,
          email: profile?.email || '',
          display_name: profile?.display_name || null,
          phone: profile?.phone || null,
          created_at: profile?.created_at || userRole.created_at,
          role: userRole.role,
          account_status: profile?.account_status || 'active',
          admin_notes: profile?.admin_notes || null,
        };
      })
    );

    setUsers(usersWithRoles);
  };

  const fetchProducts = async () => {
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
          created_at,
          trending
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
      trending: item.products.trending || false,
    })) || [];

    setProducts(formattedProducts);
  };

  const fetchOrders = async () => {
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        stores (
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;

    const ordersWithDetails = await Promise.all(
      (ordersData || []).map(async (order) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', order.user_id)
          .single();

        return {
          ...order,
          store_name: order.stores?.name || 'Unknown Store',
          user_email: profile?.email || 'Unknown User',
        };
      })
    );

    setOrders(ordersWithDetails);
  };

  const fetchPlatformStats = async () => {
    // Get total revenue and orders
    const { data: ordersData } = await supabase
      .from('orders')
      .select('total_amount, payment_status, delivery_status');

    const totalRevenue = ordersData?.reduce((sum, order) => 
      order.payment_status === 'paid' ? sum + Number(order.total_amount) : sum, 0) || 0;
    
    const totalOrders = ordersData?.length || 0;
    const pendingOrders = ordersData?.filter(o => o.delivery_status === 'pending').length || 0;

    // Get active users (users who have activity in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: activeUsersData } = await supabase
      .from('user_activity')
      .select('user_id')
      .gte('created_at', thirtyDaysAgo.toISOString());

    const uniqueActiveUsers = new Set(activeUsersData?.map(a => a.user_id)).size;

    // Calculate total commission (5% of total revenue by default)
    const { data: storesData } = await supabase
      .from('stores')
      .select('commission_rate');
    
    const avgCommissionRate = storesData?.reduce((sum, s) => sum + Number(s.commission_rate || 5), 0) / (storesData?.length || 1) || 5;
    const totalCommission = (totalRevenue * avgCommissionRate) / 100;

    setPlatformStats({
      totalRevenue,
      totalOrders,
      activeUsers: uniqueActiveUsers,
      pendingOrders,
      totalCommission,
    });
  };

  const fetchAnalytics = async () => {
    // Revenue trend for last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date: format(date, 'MMM dd'),
        rawDate: date,
      };
    });

    const revenueData = await Promise.all(
      last7Days.map(async ({ date, rawDate }) => {
        const startDate = startOfDay(rawDate);
        const endDate = endOfDay(rawDate);

        const { data } = await supabase
          .from('orders')
          .select('total_amount')
          .eq('payment_status', 'paid')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        const revenue = data?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
        const orders = data?.length || 0;

        return { date, revenue, orders };
      })
    );

    setRevenueChartData(revenueData);

    // Top 5 stores by revenue
    const { data: storesRevenue } = await supabase
      .from('orders')
      .select('store_id, total_amount, stores(name)')
      .eq('payment_status', 'paid');

    const storeRevenueMap = new Map();
    storesRevenue?.forEach(order => {
      const storeId = order.store_id;
      const storeName = order.stores?.name || 'Unknown';
      const revenue = Number(order.total_amount);
      
      if (storeRevenueMap.has(storeId)) {
        storeRevenueMap.get(storeId).revenue += revenue;
      } else {
        storeRevenueMap.set(storeId, { name: storeName, revenue });
      }
    });

    const topStores = Array.from(storeRevenueMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    setTopStoresData(topStores);
  };

  const handleApproveStore = async (storeId: string) => {
    try {
      setPendingStores(prev => prev.filter(store => store.id !== storeId));
      setRejectedStores(prev => prev.filter(store => store.id !== storeId));
      
      const { error } = await supabase
        .from('stores')
        .update({ status: 'approved' })
        .eq('id', storeId);

      if (error) throw error;

      // Log admin action
      if (user?.id) {
        await supabase.from('admin_logs').insert({
          admin_id: user.id,
          action: 'approve_store',
          target_type: 'store',
          target_id: storeId,
          details: { status: 'approved' },
        });
      }

      toast({
        title: 'Success',
        description: 'Store approved successfully',
      });

      await fetchData();
    } catch (error: any) {
      console.error('Error approving store:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve store',
        variant: 'destructive',
      });
      await fetchData();
    }
  };

  const handleRejectStore = async (storeId: string, reason: string) => {
    try {
      if (!reason.trim()) {
        toast({
          title: 'Error',
          description: 'Rejection reason is required',
          variant: 'destructive',
        });
        return;
      }

      setPendingStores(prev => prev.filter(store => store.id !== storeId));
      
      const { error } = await supabase
        .from('stores')
        .update({ 
          status: 'rejected',
          rejection_reason: reason 
        })
        .eq('id', storeId);

      if (error) throw error;

      // Log admin action
      if (user?.id) {
        await supabase.from('admin_logs').insert({
          admin_id: user.id,
          action: 'reject_store',
          target_type: 'store',
          target_id: storeId,
          details: { status: 'rejected', reason },
        });
      }

      toast({
        title: 'Success',
        description: 'Store rejected',
      });

      setRejectionDialogOpen(false);
      setStoreToReject(null);
      setRejectionReason('');
      await fetchData();
    } catch (error: any) {
      console.error('Error rejecting store:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject store',
        variant: 'destructive',
      });
      await fetchData();
    }
  };

  const handleDeleteStore = async (storeId: string) => {
    try {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', storeId);

      if (error) throw error;

      // Log admin action
      if (user?.id) {
        await supabase.from('admin_logs').insert({
          admin_id: user.id,
          action: 'delete_store',
          target_type: 'store',
          target_id: storeId,
        });
      }

      toast({
        title: 'Success',
        description: 'Store deleted successfully',
      });

      await fetchData();
    } catch (error: any) {
      console.error('Error deleting store:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete store',
        variant: 'destructive',
      });
    }
  };

  const handleChangeStoreStatus = async (storeId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('stores')
        .update({ status })
        .eq('id', storeId);

      if (error) throw error;

      // Log admin action
      if (user?.id) {
        await supabase.from('admin_logs').insert({
          admin_id: user.id,
          action: 'change_store_status',
          target_type: 'store',
          target_id: storeId,
          details: { status },
        });
      }

      toast({
        title: 'Success',
        description: `Store status updated to ${status}`,
      });

      await fetchData();
    } catch (error: any) {
      console.error('Error updating store status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update store status',
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

      // Log admin action
      if (user?.id) {
        await supabase.from('admin_logs').insert({
          admin_id: user.id,
          action: 'change_user_role',
          target_type: 'user',
          target_id: userId,
          details: { role: newRole },
        });
      }

      toast({
        title: 'Success',
        description: 'User role updated successfully',
      });

      await fetchData();
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    }
  };

  const handleSuspendUser = async (userId: string, suspend: boolean) => {
    try {
      const newStatus = suspend ? 'suspended' : 'active';
      
      const { error } = await supabase
        .from('profiles')
        .update({ account_status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      // Log admin action
      if (user?.id) {
        await supabase.from('admin_logs').insert({
          admin_id: user.id,
          action: suspend ? 'suspend_user' : 'activate_user',
          target_type: 'user',
          target_id: userId,
          details: { account_status: newStatus },
        });
      }

      toast({
        title: 'Success',
        description: suspend ? 'User suspended' : 'User activated',
      });

      await fetchData();
    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await supabase.from('inventory').delete().match({ product_id: productId });
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      // Log admin action
      if (user?.id) {
        await supabase.from('admin_logs').insert({
          admin_id: user.id,
          action: 'delete_product',
          target_type: 'product',
          target_id: productId,
        });
      }

      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });

      await fetchData();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete product',
        variant: 'destructive',
      });
    }
  };

  const handleToggleFeatured = async (storeId: string, featured: boolean) => {
    try {
      const { error } = await supabase
        .from('stores')
        .update({ featured: !featured })
        .eq('id', storeId);

      if (error) throw error;

      // Log admin action
      if (user?.id) {
        await supabase.from('admin_logs').insert({
          admin_id: user.id,
          action: 'toggle_featured_store',
          target_type: 'store',
          target_id: storeId,
          details: { featured: !featured },
        });
      }

      toast({
        title: 'Success',
        description: `Store ${!featured ? 'featured' : 'unfeatured'}`,
      });

      await fetchData();
    } catch (error: any) {
      console.error('Error toggling featured:', error);
      toast({
        title: 'Error',
        description: 'Failed to toggle featured status',
        variant: 'destructive',
      });
    }
  };

  const handleToggleTrending = async (productId: string, trending: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ trending: !trending })
        .eq('id', productId);

      if (error) throw error;

      // Log admin action
      if (user?.id) {
        await supabase.from('admin_logs').insert({
          admin_id: user.id,
          action: 'toggle_trending_product',
          target_type: 'product',
          target_id: productId,
          details: { trending: !trending },
        });
      }

      toast({
        title: 'Success',
        description: `Product ${!trending ? 'marked as trending' : 'unmarked as trending'}`,
      });

      await fetchData();
    } catch (error: any) {
      console.error('Error toggling trending:', error);
      toast({
        title: 'Error',
        description: 'Failed to toggle trending status',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, icon: Clock },
      approved: { variant: 'default' as const, icon: CheckCircle },
      rejected: { variant: 'destructive' as const, icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  const getAccountStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: 'default' as const, text: 'Active' },
      suspended: { variant: 'secondary' as const, text: 'Suspended' },
      banned: { variant: 'destructive' as const, text: 'Banned' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;

    return (
      <Badge variant={config.variant}>
        {config.text}
      </Badge>
    );
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.phone?.includes(userSearchQuery)
  );

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      order.store_name.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      order.user_email.toLowerCase().includes(orderSearchQuery.toLowerCase());
    
    const matchesStatus = orderStatusFilter === 'all' || 
      order.delivery_status === orderStatusFilter ||
      order.payment_status === orderStatusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage your platform</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* Platform Overview Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{platformStats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Platform-wide</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{platformStats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">{platformStats.pendingOrders} pending</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{platformStats.activeUsers}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{platformStats.totalCommission.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">From all sales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingStores.length}</div>
              <p className="text-xs text-muted-foreground">Stores waiting</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-7 lg:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingStores.length})</TabsTrigger>
            <TabsTrigger value="stores">Stores</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          {/* Platform Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Revenue Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" name="Revenue (₹)" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Order Volume Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Volume (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="orders" stroke="hsl(var(--secondary))" name="Orders" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Stores */}
              <Card>
                <CardHeader>
                  <CardTitle>Top 5 Stores by Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topStoresData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenue (₹)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Platform Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Stores</span>
                    <span className="font-bold">{allStores.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Approved Stores</span>
                    <span className="font-bold">{allStores.filter(s => s.status === 'approved').length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Products</span>
                    <span className="font-bold">{products.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Users</span>
                    <span className="font-bold">{users.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Vendors</span>
                    <span className="font-bold">{users.filter(u => u.role === 'vendor').length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Customers</span>
                    <span className="font-bold">{users.filter(u => u.role === 'customer').length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Platform Orders</CardTitle>
                <CardDescription>View and manage orders across all stores</CardDescription>
                <div className="flex gap-4 mt-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by order ID, store, or customer..."
                        value={orderSearchQuery}
                        onChange={(e) => setOrderSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Orders</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Store</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Delivery</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No orders found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-sm">{order.id.slice(0, 8)}...</TableCell>
                          <TableCell>{order.store_name}</TableCell>
                          <TableCell className="text-sm">{order.user_email}</TableCell>
                          <TableCell className="font-semibold">₹{order.total_amount}</TableCell>
                          <TableCell>
                            <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                              {order.payment_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={order.delivery_status === 'completed' ? 'default' : 'secondary'}>
                              {order.delivery_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(order.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Distribution by Store</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={topStoresData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenue (₹)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Financial Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Total Revenue</span>
                      <span className="text-2xl font-bold">₹{platformStats.totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full">
                      <div className="h-full bg-primary rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Platform Commission</span>
                      <span className="text-2xl font-bold text-primary">₹{platformStats.totalCommission.toFixed(2)}</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${(platformStats.totalCommission / platformStats.totalRevenue * 100).toFixed(0)}%` }} 
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(platformStats.totalCommission / platformStats.totalRevenue * 100).toFixed(1)}% of total revenue
                    </p>
                  </div>

                  <div className="pt-4 border-t space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Avg. Commission Rate</span>
                      <span className="font-semibold">5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Stores</span>
                      <span className="font-semibold">{allStores.filter(s => s.status === 'approved').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Avg. Order Value</span>
                      <span className="font-semibold">
                        ₹{platformStats.totalOrders > 0 
                          ? (platformStats.totalRevenue / platformStats.totalOrders).toFixed(2) 
                          : '0'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pending Stores Tab */}
          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Store Approvals</CardTitle>
                <CardDescription>Review and approve store registrations</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingStores.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No pending approvals</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Store Name</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingStores.map((store) => (
                        <TableRow key={store.id}>
                          <TableCell className="font-medium">{store.name}</TableCell>
                          <TableCell>{store.owner_name || store.owner_email}</TableCell>
                          <TableCell className="text-sm">
                            {store.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {store.phone}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm max-w-xs truncate">{store.address}</TableCell>
                          <TableCell className="text-sm">
                            {new Date(store.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setSelectedStore(store)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Store Details</DialogTitle>
                                </DialogHeader>
                                {selectedStore && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-muted-foreground">Store Name</Label>
                                        <p className="font-medium">{selectedStore.name}</p>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">Status</Label>
                                        <div className="mt-1">{getStatusBadge(selectedStore.status)}</div>
                                      </div>
                                    </div>

                                    <div>
                                      <Label className="text-muted-foreground">Address</Label>
                                      <p>{selectedStore.address}</p>
                                    </div>

                                    {selectedStore.description && (
                                      <div>
                                        <Label className="text-muted-foreground">Description</Label>
                                        <p>{selectedStore.description}</p>
                                      </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-muted-foreground">Owner</Label>
                                        <p>{selectedStore.owner_name || 'N/A'}</p>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">Email</Label>
                                        <p className="text-sm">{selectedStore.owner_email || 'N/A'}</p>
                                      </div>
                                    </div>

                                    {selectedStore.phone && (
                                      <div>
                                        <Label className="text-muted-foreground">Phone</Label>
                                        <p>{selectedStore.phone}</p>
                                      </div>
                                    )}

                                    {selectedStore.specialties && selectedStore.specialties.length > 0 && (
                                      <div>
                                        <Label className="text-muted-foreground">Specialties</Label>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                          {selectedStore.specialties.map((specialty, index) => (
                                            <Badge key={index} variant="secondary">
                                              {specialty}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {selectedStore.photo_urls && selectedStore.photo_urls.length > 0 && (
                                      <div>
                                        <Label className="text-muted-foreground">Photos</Label>
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                          {selectedStore.photo_urls.map((url, index) => (
                                            <img
                                              key={index}
                                              src={url}
                                              alt={`Store photo ${index + 1}`}
                                              className="w-full h-32 object-cover rounded-md"
                                            />
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            <Button 
                              size="sm" 
                              onClick={() => handleApproveStore(store.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => {
                                setStoreToReject(store.id);
                                setRejectionDialogOpen(true);
                              }}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Rejection Dialog */}
            <AlertDialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reject Store Application</AlertDialogTitle>
                  <AlertDialogDescription>
                    Please provide a reason for rejecting this store application. The vendor will be notified.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                  <Label htmlFor="rejection-reason">Rejection Reason</Label>
                  <Textarea
                    id="rejection-reason"
                    placeholder="Enter reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="mt-2"
                    rows={4}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => {
                    setRejectionReason('');
                    setStoreToReject(null);
                  }}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => storeToReject && handleRejectStore(storeToReject, rejectionReason)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Reject Store
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          {/* All Stores Tab */}
          <TabsContent value="stores" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Stores</CardTitle>
                <CardDescription>Manage all registered stores</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Featured</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allStores.map((store) => (
                      <TableRow key={store.id}>
                        <TableCell className="font-medium">{store.name}</TableCell>
                        <TableCell>{store.owner_name || store.owner_email}</TableCell>
                        <TableCell>{getStatusBadge(store.status)}</TableCell>
                        <TableCell>
                          <Switch
                            checked={store.featured}
                            onCheckedChange={() => handleToggleFeatured(store.id, store.featured)}
                          />
                        </TableCell>
                        <TableCell>{store.commission_rate}%</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Select
                            value={store.status}
                            onValueChange={(value) => handleChangeStoreStatus(store.id, value)}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Store</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this store? This action cannot be undone.
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Products</CardTitle>
                <CardDescription>Manage products across all stores</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Store</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Trending</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.store_name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{product.category || 'Uncategorized'}</Badge>
                        </TableCell>
                        <TableCell>₹{product.price}</TableCell>
                        <TableCell>
                          <Badge variant={product.in_stock ? 'default' : 'secondary'}>
                            {product.quantity} units
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={product.trending}
                            onCheckedChange={() => handleToggleTrending(product.id, product.trending)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Product</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this product? This will also remove it from inventory.
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage all platform users</CardDescription>
                <div className="mt-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by email, name, or phone..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.display_name || 'No Name'}
                        </TableCell>
                        <TableCell className="text-sm">{user.email}</TableCell>
                        <TableCell className="text-sm">{user.phone || 'N/A'}</TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(value) => handleChangeUserRole(user.id, value as 'customer' | 'vendor' | 'admin')}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="customer">Customer</SelectItem>
                              <SelectItem value="vendor">Vendor</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>{getAccountStatusBadge(user.account_status)}</TableCell>
                        <TableCell className="text-sm">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>User Details</DialogTitle>
                              </DialogHeader>
                              {selectedUser && (
                                <div className="space-y-4">
                                  <div>
                                    <Label className="text-muted-foreground">Name</Label>
                                    <p>{selectedUser.display_name || 'No Name'}</p>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">Email</Label>
                                    <p>{selectedUser.email}</p>
                                  </div>
                                  {selectedUser.phone && (
                                    <div>
                                      <Label className="text-muted-foreground">Phone</Label>
                                      <p>{selectedUser.phone}</p>
                                    </div>
                                  )}
                                  <div>
                                    <Label className="text-muted-foreground">Role</Label>
                                    <p className="capitalize">{selectedUser.role}</p>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">Account Status</Label>
                                    <div className="mt-1">{getAccountStatusBadge(selectedUser.account_status)}</div>
                                  </div>
                                  {selectedUser.admin_notes && (
                                    <div>
                                      <Label className="text-muted-foreground">Admin Notes</Label>
                                      <p className="text-sm">{selectedUser.admin_notes}</p>
                                    </div>
                                  )}
                                  <div>
                                    <Label className="text-muted-foreground">Joined</Label>
                                    <p>{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          {user.account_status !== 'suspended' ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleSuspendUser(user.id, true)}
                            >
                              <Ban className="w-4 h-4 mr-1" />
                              Suspend
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleSuspendUser(user.id, false)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Activate
                            </Button>
                          )}
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