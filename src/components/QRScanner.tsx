import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scan, CheckCircle2, XCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface QRScannerProps {
  storeId: string;
  onScanSuccess?: (redemption: any) => void;
}

export const QRScanner = ({ storeId, onScanSuccess }: QRScannerProps) => {
  const [qrCode, setQrCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastScan, setLastScan] = useState<any>(null);

  const handleScan = async () => {
    if (!qrCode.trim()) {
      toast({
        title: "Enter QR Code",
        description: "Please enter the QR code to scan",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Fetch the QR redemption record
      const { data: redemption, error: fetchError } = await supabase
        .from("qr_redemptions")
        .select(`
          *,
          products (name, image_url),
          profiles!qr_redemptions_user_id_fkey (display_name, phone)
        `)
        .eq("qr_code", qrCode.trim())
        .eq("store_id", storeId)
        .single();

      if (fetchError || !redemption) {
        toast({
          title: "Invalid QR Code",
          description: "This QR code is not valid for this store",
          variant: "destructive"
        });
        return;
      }

      // Check if already redeemed
      if (redemption.status === "redeemed") {
        toast({
          title: "Already Redeemed",
          description: `This code was redeemed on ${new Date(redemption.redeemed_at).toLocaleString()}`,
          variant: "destructive"
        });
        setLastScan({ ...redemption, status: "already_redeemed" });
        return;
      }

      // Check if expired
      if (new Date(redemption.expires_at) < new Date()) {
        toast({
          title: "Expired",
          description: "This QR code has expired",
          variant: "destructive"
        });
        await supabase
          .from("qr_redemptions")
          .update({ status: "expired" })
          .eq("id", redemption.id);
        setLastScan({ ...redemption, status: "expired" });
        return;
      }

      // Update to scanned if pending
      if (redemption.status === "pending") {
        const { data: user } = await supabase.auth.getUser();
        await supabase
          .from("qr_redemptions")
          .update({
            status: "scanned",
            scanned_at: new Date().toISOString(),
            scanned_by: user.user?.id
          })
          .eq("id", redemption.id);
      }

      setLastScan(redemption);
      toast({
        title: "QR Code Scanned",
        description: "Ready to complete the sale"
      });
      
      if (onScanSuccess) onScanSuccess(redemption);
    } catch (error: any) {
      console.error("Error scanning QR code:", error);
      toast({
        title: "Scan Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!lastScan) return;

    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      
      // Mark as redeemed
      const { error } = await supabase
        .from("qr_redemptions")
        .update({
          status: "redeemed",
          redeemed_at: new Date().toISOString(),
          scanned_by: user.user?.id
        })
        .eq("id", lastScan.id);

      if (error) throw error;

      // Update reservation status if linked
      if (lastScan.reservation_id) {
        await supabase
          .from("reservations")
          .update({ status: "completed" })
          .eq("id", lastScan.reservation_id);
      }

      // Decrease inventory
      if (lastScan.product_id) {
        const { data: inventory } = await supabase
          .from("inventory")
          .select("quantity")
          .eq("product_id", lastScan.product_id)
          .eq("store_id", storeId)
          .single();

        if (inventory && inventory.quantity > 0) {
          await supabase
            .from("inventory")
            .update({ quantity: inventory.quantity - 1 })
            .eq("product_id", lastScan.product_id)
            .eq("store_id", storeId);
        }
      }

      toast({
        title: "Sale Completed",
        description: "QR code redeemed successfully"
      });

      setLastScan(null);
      setQrCode("");
    } catch (error: any) {
      console.error("Error redeeming QR code:", error);
      toast({
        title: "Redemption Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Scan QR Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter or scan QR code"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
            />
            <Button onClick={handleScan} disabled={loading}>
              Scan
            </Button>
          </div>
        </CardContent>
      </Card>

      {lastScan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {lastScan.status === "scanned" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              {lastScan.status === "already_redeemed" && <XCircle className="h-5 w-5 text-red-500" />}
              {lastScan.status === "expired" && <Clock className="h-5 w-5 text-orange-500" />}
              Scan Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">{lastScan.products?.name}</p>
              <p className="text-sm text-muted-foreground">
                Customer: {lastScan.profiles?.display_name || "Unknown"}
              </p>
              {lastScan.profiles?.phone && (
                <p className="text-sm text-muted-foreground">
                  Phone: {lastScan.profiles.phone}
                </p>
              )}
            </div>

            {lastScan.status === "scanned" && (
              <Button 
                onClick={handleRedeem} 
                disabled={loading}
                className="w-full"
              >
                Complete Sale
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
