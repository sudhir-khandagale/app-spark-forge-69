import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/BackButton';
import RoleBasedBottomNav from '@/components/RoleBasedBottomNav';
import { DollarSign, TrendingUp, Package, Download, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EarningsData {
  totalRevenue: number;
  totalOrders: number;
  pendingPayouts: number;
  completedPayouts: number;
  platformCommission: number;
}

interface Transaction {
  id: string;
  created_at: string;
  total_amount: number;
  payment_status: string;
  delivery_status: string;
  receipt_number: string | null;
}

export default function VendorEarnings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isVendor, isAdmin } = useUserRole();
  
  const [earnings, setEarnings] = useState<EarningsData>({
    totalRevenue: 0,
    totalOrders: 0,
    pendingPayouts: 0,
    completedPayouts: 0,
    platformCommission: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('all');

  useEffect(() => {
    if (user && (isVendor || isAdmin)) {
      fetchEarningsData();
    }
  }, [user, isVendor, isAdmin, timeRange, selectedStoreId]);

  const fetchEarningsData = async () => {
    try {
      // Get all user's stores
      const { data: storesData, error: storeError } = await supabase
        .from('stores')
        .select('id, name')
        .eq('owner_id', user?.id)
        .eq('status', 'approved');

      if (storeError) throw storeError;

      if (!storesData || storesData.length === 0) {
        toast({
          title: 'No Store Found',
          description: 'Please register your store first',
          variant: 'destructive',
        });
        navigate('/onboarding/merchant');
        return;
      }

      setStores(storesData);
      
      // Set selected store if not already set
      const activeStoreId = selectedStoreId || storesData[0].id;
      if (!selectedStoreId) {
        setSelectedStoreId(activeStoreId);
      }

      // Calculate date range
      let dateFilter = '';
      const now = new Date();
      if (timeRange === '7days') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = weekAgo.toISOString();
      } else if (timeRange === '30days') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = monthAgo.toISOString();
      } else if (timeRange === '90days') {
        const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        dateFilter = threeMonthsAgo.toISOString();
      }

      // Fetch orders for the selected store
      let query = supabase
        .from('orders')
        .select('*')
        .eq('store_id', activeStoreId)
        .order('created_at', { ascending: false });

      if (dateFilter) {
        query = query.gte('created_at', dateFilter);
      }

      const { data: ordersData, error } = await query;

      if (error) throw error;

      // Calculate earnings
      const completedOrders = ordersData?.filter(
        (o) => o.delivery_status === 'delivered' && o.payment_status === 'completed'
      ) || [];
      
      const pendingOrders = ordersData?.filter(
        (o) => ['confirmed', 'processing', 'shipped', 'out_for_delivery'].includes(o.delivery_status) 
        && o.payment_status === 'completed'
      ) || [];

      const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total_amount, 0);
      const pendingPayouts = pendingOrders.reduce((sum, o) => sum + o.total_amount, 0);
      
      // Platform takes 5% commission
      const commission = totalRevenue * 0.05;

      setEarnings({
        totalRevenue,
        totalOrders: ordersData?.length || 0,
        pendingPayouts,
        completedPayouts: totalRevenue - commission,
        platformCommission: commission,
      });

      setTransactions(ordersData || []);
    } catch (error) {
      console.error('Error fetching earnings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load earnings data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (transactions.length === 0) {
      toast({
        title: 'No Data',
        description: 'No transactions to export',
        variant: 'destructive',
      });
      return;
    }

    const headers = ['Date', 'Order ID', 'Receipt Number', 'Amount', 'Payment Status', 'Delivery Status'];
    const rows = transactions.map(t => [
      format(new Date(t.created_at), 'yyyy-MM-dd HH:mm'),
      t.id.slice(0, 8),
      t.receipt_number || 'N/A',
      t.total_amount.toFixed(2),
      t.payment_status,
      t.delivery_status,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `earnings-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: 'Earnings report exported successfully',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BackButton fallbackPath="/vendor/dashboard" />
              <div>
                <h1 className="text-2xl font-bold">Earnings & Payouts</h1>
                <p className="text-sm text-muted-foreground">Track your revenue</p>
              </div>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {stores.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Store:</span>
              <Select value={selectedStoreId || undefined} onValueChange={setSelectedStoreId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select store" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <p className="text-xs text-muted-foreground">Total Revenue</p>
              </div>
              <p className="text-2xl font-bold">₹{earnings.totalRevenue.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <p className="text-xs text-muted-foreground">Net Earnings</p>
              </div>
              <p className="text-2xl font-bold text-green-600">₹{earnings.completedPayouts.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">After 5% commission</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-yellow-600" />
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <p className="text-2xl font-bold text-yellow-600">₹{earnings.pendingPayouts.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-primary" />
                <p className="text-xs text-muted-foreground">Total Orders</p>
              </div>
              <p className="text-2xl font-bold">{earnings.totalOrders}</p>
            </CardContent>
          </Card>
        </div>

        {/* Commission Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Commission Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Gross Revenue</span>
              <span className="font-semibold">₹{earnings.totalRevenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Platform Fee (5%)</span>
              <span className="font-semibold text-destructive">- ₹{earnings.platformCommission.toFixed(2)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="font-semibold">Your Payout</span>
              <span className="text-xl font-bold text-primary">₹{earnings.completedPayouts.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Transaction History</CardTitle>
            <Button size="sm" variant="outline" onClick={exportToCSV} className="gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">#{transaction.id.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(transaction.created_at), 'MMM dd, yyyy')}
                      </p>
                      <div className="flex gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          transaction.payment_status === 'completed' 
                            ? 'bg-green-500/10 text-green-600' 
                            : 'bg-yellow-500/10 text-yellow-600'
                        }`}>
                          {transaction.payment_status}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          transaction.delivery_status === 'delivered' 
                            ? 'bg-green-500/10 text-green-600' 
                            : 'bg-blue-500/10 text-blue-600'
                        }`}>
                          {transaction.delivery_status}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₹{transaction.total_amount.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        Net: ₹{(transaction.total_amount * 0.95).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <RoleBasedBottomNav />
    </div>
  );
}
