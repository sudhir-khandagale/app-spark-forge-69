import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order');
  const [receipt, setReceipt] = useState<any>(null);

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

          <Button onClick={() => navigate('/profile')} className="w-full">
            Back to Profile
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
