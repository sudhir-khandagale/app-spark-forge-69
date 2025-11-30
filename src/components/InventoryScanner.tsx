import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Camera, X, CheckCircle, Scan } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface InventoryScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  onStockUpdated: () => void;
}

interface ScannedProduct {
  id: string;
  inventoryId: string;
  name: string;
  currentStock: number;
  barcode: string;
}

export function InventoryScanner({ open, onOpenChange, storeId, onStockUpdated }: InventoryScannerProps) {
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [scannedProduct, setScannedProduct] = useState<ScannedProduct | null>(null);
  const [newQuantity, setNewQuantity] = useState('');
  const [scannedItems, setScannedItems] = useState<Array<{ name: string; quantity: number }>>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (open && scanning) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [open, scanning]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      toast({
        title: 'Camera Error',
        description: 'Failed to access camera',
        variant: 'destructive',
      });
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleManualEntry = async () => {
    if (!manualBarcode.trim()) return;
    await findProductByBarcode(manualBarcode.trim());
    setManualBarcode('');
  };

  const findProductByBarcode = async (barcode: string) => {
    try {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, barcode')
        .eq('barcode', barcode)
        .single();

      if (productError || !product) {
        toast({
          title: 'Product Not Found',
          description: `No product found with barcode: ${barcode}`,
          variant: 'destructive',
        });
        return;
      }

      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory')
        .select('id, quantity')
        .eq('product_id', product.id)
        .eq('store_id', storeId)
        .single();

      if (inventoryError || !inventory) {
        toast({
          title: 'Inventory Not Found',
          description: 'This product is not in your inventory',
          variant: 'destructive',
        });
        return;
      }

      setScannedProduct({
        id: product.id,
        inventoryId: inventory.id,
        name: product.name,
        currentStock: inventory.quantity,
        barcode: barcode,
      });
      setNewQuantity(inventory.quantity.toString());
      setScanning(false);
      stopCamera();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to find product',
        variant: 'destructive',
      });
    }
  };

  const updateStock = async () => {
    if (!scannedProduct || !newQuantity) return;

    const quantity = parseInt(newQuantity);
    if (isNaN(quantity) || quantity < 0) {
      toast({
        title: 'Invalid Quantity',
        description: 'Please enter a valid number',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('inventory')
        .update({
          quantity: quantity,
          last_updated: new Date().toISOString(),
        })
        .eq('id', scannedProduct.inventoryId);

      if (error) throw error;

      if (batchMode) {
        setScannedItems(prev => [...prev, { name: scannedProduct.name, quantity }]);
        toast({
          title: 'Stock Updated',
          description: `${scannedProduct.name} - ${quantity} units`,
        });
        setScannedProduct(null);
        setNewQuantity('');
        setScanning(true);
      } else {
        toast({
          title: 'Success',
          description: 'Stock updated successfully',
        });
        onStockUpdated();
        handleClose();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update stock',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    stopCamera();
    setScanning(false);
    setScannedProduct(null);
    setNewQuantity('');
    setBatchMode(false);
    setScannedItems([]);
    setManualBarcode('');
    onOpenChange(false);
  };

  const finishBatchMode = () => {
    onStockUpdated();
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Scan Product Barcode
          </DialogTitle>
          <DialogDescription>
            Scan barcode or enter manually to update stock
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Batch Mode Toggle */}
          {!scannedProduct && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="batch-mode"
                checked={batchMode}
                onChange={(e) => setBatchMode(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="batch-mode" className="text-sm">
                Batch Mode (scan multiple items)
              </Label>
            </div>
          )}

          {/* Scanned Items List (Batch Mode) */}
          {batchMode && scannedItems.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-2 max-h-32 overflow-y-auto">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Scanned Items ({scannedItems.length})
              </div>
              {scannedItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="truncate">{item.name}</span>
                  <Badge variant="outline" className="ml-2">
                    {item.quantity} units
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {!scannedProduct ? (
            <>
              {/* Manual Entry */}
              <div className="space-y-2">
                <Label>Enter Barcode Manually</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Scan or type barcode..."
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualEntry()}
                    autoFocus
                  />
                  <Button onClick={handleManualEntry} variant="secondary">
                    Search
                  </Button>
                </div>
              </div>

              {/* Camera Scanning */}
              {scanning ? (
                <div className="space-y-3">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-64 bg-black rounded-lg object-cover"
                  />
                  <Button 
                    onClick={() => {
                      stopCamera();
                      setScanning(false);
                    }} 
                    variant="outline" 
                    className="w-full"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Stop Camera
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={() => setScanning(true)} 
                  variant="outline" 
                  className="w-full"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Start Camera Scan
                </Button>
              )}
            </>
          ) : (
            <div className="space-y-4">
              {/* Product Info */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-sm font-medium mb-1">{scannedProduct.name}</div>
                <div className="text-xs text-muted-foreground">
                  Current Stock: {scannedProduct.currentStock} units
                </div>
              </div>

              {/* New Quantity Input */}
              <div className="space-y-2">
                <Label>New Stock Quantity</Label>
                <Input
                  type="number"
                  min="0"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  autoFocus
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button onClick={() => setScannedProduct(null)} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={updateStock} className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Update Stock
                </Button>
              </div>
            </div>
          )}

          {/* Finish Batch Button */}
          {batchMode && scannedItems.length > 0 && !scannedProduct && (
            <Button onClick={finishBatchMode} className="w-full" variant="default">
              Finish Batch ({scannedItems.length} items updated)
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
