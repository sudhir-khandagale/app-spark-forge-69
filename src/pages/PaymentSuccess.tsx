import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order');
  const [receipt, setReceipt] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchReceipt();
    }
  }, [orderId]);

  const fetchReceipt = async () => {
    const { data } = await supabase.functions.invoke('generate-receipt', {
      body: { orderId }
    });
    setReceipt(data);
  };

  const downloadInvoice = async () => {
    if (!orderId) return;
    
    setDownloading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-invoice', {
        body: { orderId }
      });

      if (error) throw error;

      if (data?.invoice?.html) {
        // Create a blob and download
        const blob = new Blob([data.invoice.html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice_${data.invoice.receiptNumber}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: 'Invoice Downloaded',
          description: 'Your invoice has been downloaded successfully',
        });
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to download invoice',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Order Successful!</CardTitle>
          <CardDescription>
            Your order has been placed successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {receipt && (
            <>
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Receipt Number</p>
                <p className="font-mono text-sm font-bold">{receipt.receiptNumber}</p>
              </div>

              <div className="space-y-2 text-sm">
                <p><strong>Store:</strong> {receipt.store?.name}</p>
                <p><strong>Total:</strong> ₹{receipt.totalAmount}</p>
                <p><strong>Status:</strong> {receipt.paymentStatus}</p>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Button 
              onClick={downloadInvoice} 
              disabled={downloading || !orderId}
              className="w-full"
              variant="outline"
            >
              {downloading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Generating Invoice...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Download Invoice
                </>
              )}
            </Button>

            <Button onClick={() => navigate('/profile')} className="w-full">
              Back to Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
