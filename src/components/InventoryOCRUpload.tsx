import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Camera, Upload, Loader2, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ExtractedProduct {
  name: string;
  quantity: number;
  price: number;
  category?: string;
}

interface InventoryOCRUploadProps {
  storeId: string;
  onUploadComplete: () => void;
}

export const InventoryOCRUpload = ({ storeId, onUploadComplete }: InventoryOCRUploadProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedProducts, setExtractedProducts] = useState<ExtractedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      await processImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (base64Image: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('inventory-ocr', {
        body: { imageBase64: base64Image, storeId }
      });

      if (error) throw error;

      setExtractedProducts(data.products);
      toast({
        title: "Success!",
        description: `Extracted ${data.products.length} products from image`,
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process image",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmUpload = async () => {
    setProcessing(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const product of extractedProducts) {
        try {
          // Check if product exists
          const { data: existingProduct } = await supabase
            .from('products')
            .select('id')
            .ilike('name', product.name)
            .single();

          let productId = existingProduct?.id;

          // Create product if doesn't exist
          if (!productId) {
            const { data: newProduct, error: productError } = await supabase
              .from('products')
              .insert({
                name: product.name,
                category: product.category || 'General'
              })
              .select()
              .single();

            if (productError) throw productError;
            productId = newProduct.id;
          }

          // Create or update inventory
          const { error: invError } = await supabase
            .from('inventory')
            .upsert({
              store_id: storeId,
              product_id: productId,
              quantity: product.quantity,
              price: product.price,
              low_stock_threshold: 10
            }, {
              onConflict: 'store_id,product_id'
            });

          if (invError) throw invError;
          successCount++;
        } catch (error) {
          console.error('Error adding product:', product.name, error);
          errorCount++;
        }
      }

      toast({
        title: "Upload Complete!",
        description: `Successfully added ${successCount} products${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      });

      setIsOpen(false);
      setImagePreview(null);
      setExtractedProducts([]);
      onUploadComplete();
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload products",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="gap-2"
      >
        <Camera className="h-4 w-4" />
        Upload Image
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>📸 Upload Inventory Image</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Card className="p-6 border-dashed border-2 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {!imagePreview ? (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="font-medium">Upload your inventory list</p>
                    <p className="text-sm text-muted-foreground">
                      Take a photo of your handwritten or printed inventory
                    </p>
                  </div>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    Choose Image
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <img
                    src={imagePreview}
                    alt="Inventory"
                    className="max-h-48 mx-auto rounded-lg"
                  />
                  {loading && (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Processing image...</span>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {extractedProducts.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Extracted Products ({extractedProducts.length})</h3>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {extractedProducts.map((product, idx) => (
                    <Card key={idx} className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {product.quantity} • ₹{product.price}
                            {product.category && ` • ${product.category}`}
                          </p>
                        </div>
                        <Check className="h-5 w-5 text-green-500" />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setIsOpen(false);
                  setImagePreview(null);
                  setExtractedProducts([]);
                }}
                variant="outline"
                className="flex-1"
                disabled={processing}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={confirmUpload}
                disabled={extractedProducts.length === 0 || processing}
                className="flex-1"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Confirm & Upload
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
