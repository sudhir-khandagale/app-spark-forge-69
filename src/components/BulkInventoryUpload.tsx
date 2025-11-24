import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BulkInventoryUploadProps {
  storeId: string;
  onUploadComplete?: () => void;
}

interface UploadResult {
  success: number;
  failed: number;
  errors: string[];
}

export default function BulkInventoryUpload({ storeId, onUploadComplete }: BulkInventoryUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  const downloadTemplate = () => {
    const template = 'Product Name,Category,Price,Quantity,Low Stock Threshold,Barcode\nExample Product,Electronics,299.99,50,5,1234567890\n';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload a CSV file',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      
      // Validate headers
      const requiredHeaders = ['Product Name', 'Price', 'Quantity'];
      const hasRequiredHeaders = requiredHeaders.every(h => 
        headers.some(header => header.toLowerCase() === h.toLowerCase())
      );

      if (!hasRequiredHeaders) {
        throw new Error('CSV must contain: Product Name, Price, Quantity columns');
      }

      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      // Process each line
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < 3) continue;

        try {
          const productName = values[0];
          const category = values[1] || null;
          const price = parseFloat(values[2]);
          const quantity = parseInt(values[3]) || 0;
          const lowStockThreshold = parseInt(values[4]) || 5;
          const barcode = values[5] || null;

          if (!productName || isNaN(price)) {
            throw new Error(`Invalid data at line ${i + 1}`);
          }

          // Check if product exists
          let { data: product, error: productError } = await supabase
            .from('products')
            .select('id')
            .eq('name', productName)
            .eq('barcode', barcode)
            .limit(1)
            .maybeSingle();

          if (productError && productError.code !== 'PGRST116') throw productError;

          // Create product if doesn't exist
          if (!product) {
            const { data: newProduct, error: createError } = await supabase
              .from('products')
              .insert({
                name: productName,
                category,
                barcode
              })
              .select('id')
              .single();

            if (createError) throw createError;
            product = newProduct;
          }

          // Create or update inventory
          const { error: inventoryError } = await supabase
            .from('inventory')
            .upsert({
              product_id: product.id,
              store_id: storeId,
              price,
              quantity,
              low_stock_threshold: lowStockThreshold,
              in_stock: quantity > 0
            }, {
              onConflict: 'product_id,store_id'
            });

          if (inventoryError) throw inventoryError;

          success++;
        } catch (error: any) {
          failed++;
          errors.push(`Line ${i + 1}: ${error.message}`);
        }
      }

      setResult({ success, failed, errors: errors.slice(0, 10) });

      if (success > 0) {
        toast({
          title: 'Upload Complete',
          description: `Successfully uploaded ${success} products`
        });
        onUploadComplete?.();
      }
    } catch (error: any) {
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          <CardTitle>Bulk Inventory Upload</CardTitle>
        </div>
        <CardDescription>Upload multiple products at once using CSV file</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button variant="outline" onClick={downloadTemplate} className="w-full">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Download CSV Template
          </Button>
          
          <div className="relative">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={uploading}
              className="cursor-pointer"
            />
          </div>

          {uploading && (
            <Alert>
              <Upload className="h-4 w-4 animate-pulse" />
              <AlertDescription>Uploading and processing your inventory...</AlertDescription>
            </Alert>
          )}
        </div>

        {result && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-semibold">Success</span>
                </div>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                  {result.success}
                </p>
              </div>
              
              {result.failed > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                    <XCircle className="h-4 w-4" />
                    <span className="font-semibold">Failed</span>
                  </div>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100 mt-1">
                    {result.failed}
                  </p>
                </div>
              )}
            </div>

            {result.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-2">Upload Errors:</p>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    {result.errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                    {result.errors.length >= 10 && <li>...and more</li>}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>CSV Format:</strong> Product Name, Category, Price, Quantity, Low Stock Threshold, Barcode
            <br />
            Existing products will be updated based on barcode. New products will be created automatically.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
