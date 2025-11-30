import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BackButton } from "@/components/BackButton";
import { QRScanner } from "@/components/QRScanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const VendorScanQR = () => {
  const navigate = useNavigate();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    today: 0,
    week: 0,
    total: 0
  });

  useEffect(() => {
    fetchStoreAndStats();
  }, []);

  const fetchStoreAndStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Get vendor's store
      const { data: store, error: storeError } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (storeError || !store) {
        toast({
          title: "No Store Found",
          description: "You need to register a store first",
          variant: "destructive"
        });
        navigate("/merchant-onboarding");
        return;
      }

      setStoreId(store.id);

      // Fetch redemption stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: redemptions } = await supabase
        .from("qr_redemptions")
        .select("id, redeemed_at")
        .eq("store_id", store.id)
        .eq("status", "redeemed");

      if (redemptions) {
        const todayCount = redemptions.filter(r => 
          new Date(r.redeemed_at) >= today
        ).length;
        
        const weekCount = redemptions.filter(r => 
          new Date(r.redeemed_at) >= weekAgo
        ).length;

        setStats({
          today: todayCount,
          week: weekCount,
          total: redemptions.length
        });
      }
    } catch (error: any) {
      console.error("Error fetching store:", error);
      toast({
        title: "Error",
        description: "Failed to load store information",
        variant: "destructive"
      });
    }
  };

  const handleScanSuccess = () => {
    // Refresh stats after successful scan
    fetchStoreAndStats();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-2xl font-bold">Scan QR Codes</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Redemption Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{stats.today}</p>
                <p className="text-sm text-muted-foreground">Today</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{stats.week}</p>
                <p className="text-sm text-muted-foreground">This Week</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{stats.total}</p>
                <p className="text-sm text-muted-foreground">All Time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {storeId && (
          <QRScanner 
            storeId={storeId} 
            onScanSuccess={handleScanSuccess}
          />
        )}
      </main>
    </div>
  );
};

export default VendorScanQR;
