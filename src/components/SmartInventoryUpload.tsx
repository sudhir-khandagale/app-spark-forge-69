import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Image, Table, Loader2, CheckCircle2, AlertCircle, Edit2, Save, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ExtractedProduct {
  name: string;
  description?: string;
  price?: number;
  category?: string;
  brand?: string;
  barcode?: string;
  quantity?: number;
  confidence: number;
  isDuplicate?: boolean;
}

interface SmartInventoryUploadProps {
  storeId: string;
  onSuccess?: () => void;
}

export const SmartInventoryUpload = ({ storeId, onSuccess }: SmartInventoryUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extractedProducts, setExtractedProducts] = useState<ExtractedProduct[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedProduct, setEditedProduct] = useState<ExtractedProduct | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
        'application/pdf',
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!validTypes.includes(selectedFile.type) && 
          !selectedFile.name.endsWith('.csv') && 
          !selectedFile.name.endsWith('.xlsx') && 
          !selectedFile.name.endsWith('.xls')) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF, Excel, CSV, or image file",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (20MB max)
      if (selectedFile.size > 20 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 20MB",
          variant: "destructive"
        });
        return;
      }

      setFile(selectedFile);
      setExtractedProducts([]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a file first",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('storeId', storeId);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/smart-inventory-upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      setExtractedProducts(result.products);

      toast({
        title: "Products Extracted",
        description: `Found ${result.totalCount} products (${result.duplicateCount} duplicates detected)`,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditedProduct({ ...extractedProducts[index] });
  };

  const saveEdit = () => {
    if (editingIndex !== null && editedProduct) {
      const updated = [...extractedProducts];
      updated[editingIndex] = editedProduct;
      setExtractedProducts(updated);
      setEditingIndex(null);
      setEditedProduct(null);
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditedProduct(null);
  };

  const removeProduct = (index: number) => {
    setExtractedProducts(products => products.filter((_, i) => i !== index));
  };

  const confirmAndSave = async () => {
    if (extractedProducts.length === 0) return;

    setUploading(true);
    try {
      const productsToAdd = extractedProducts.filter(p => !p.isDuplicate);
      
      for (const product of productsToAdd) {
        // Create product
        const { data: newProduct, error: productError } = await supabase
          .from('products')
          .insert({
            name: product.name,
            description: product.description,
            category: product.category,
            barcode: product.barcode,
          })
          .select()
          .single();

        if (productError) throw productError;

        // Create inventory entry
        const { error: inventoryError } = await supabase
          .from('inventory')
          .insert({
            product_id: newProduct.id,
            store_id: storeId,
            price: product.price || 0,
            quantity: product.quantity || 0,
            in_stock: (product.quantity || 0) > 0,
          });

        if (inventoryError) throw inventoryError;
      }

      toast({
        title: "Products Added",
        description: `Successfully added ${productsToAdd.length} products to inventory`,
      });

      setExtractedProducts([]);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: "Failed to Save",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = () => {
    if (!file) return <Upload className="h-8 w-8" />;
    if (file.type.includes('image')) return <Image className="h-8 w-8" />;
    if (file.type.includes('pdf')) return <FileText className="h-8 w-8" />;
    return <Table className="h-8 w-8" />;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Smart Inventory Upload
          </CardTitle>
          <CardDescription>
            Upload PDF invoices, Excel sheets, CSV files, or catalog images. AI will automatically extract product information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-upload">Select File</Label>
            <Input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              accept=".pdf,.csv,.xls,.xlsx,image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileChange}
              disabled={uploading}
            />
            {file && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                {getFileIcon()}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
            )}
          </div>

          <Button 
            onClick={handleUpload} 
            disabled={!file || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Extract Products
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {extractedProducts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Review Extracted Products</CardTitle>
                <CardDescription>
                  Review and edit products before adding to inventory
                </CardDescription>
              </div>
              <Button onClick={confirmAndSave} disabled={uploading}>
                <Save className="h-4 w-4 mr-2" />
                Confirm & Save ({extractedProducts.filter(p => !p.isDuplicate).length} products)
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <TableComponent>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {extractedProducts.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {editingIndex === index ? (
                        <Input
                          value={editedProduct?.name}
                          onChange={(e) => setEditedProduct(prev => prev ? { ...prev, name: e.target.value } : null)}
                          className="h-8"
                        />
                      ) : (
                        <div>
                          <div className="font-medium">{product.name}</div>
                          {product.description && (
                            <div className="text-xs text-muted-foreground truncate max-w-xs">
                              {product.description}
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingIndex === index ? (
                        <Input
                          value={editedProduct?.category}
                          onChange={(e) => setEditedProduct(prev => prev ? { ...prev, category: e.target.value } : null)}
                          className="h-8"
                        />
                      ) : (
                        product.category
                      )}
                    </TableCell>
                    <TableCell>
                      {editingIndex === index ? (
                        <Input
                          type="number"
                          value={editedProduct?.price}
                          onChange={(e) => setEditedProduct(prev => prev ? { ...prev, price: parseFloat(e.target.value) } : null)}
                          className="h-8 w-24"
                        />
                      ) : (
                        product.price ? `₹${product.price}` : '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {editingIndex === index ? (
                        <Input
                          type="number"
                          value={editedProduct?.quantity}
                          onChange={(e) => setEditedProduct(prev => prev ? { ...prev, quantity: parseInt(e.target.value) } : null)}
                          className="h-8 w-20"
                        />
                      ) : (
                        product.quantity || 0
                      )}
                    </TableCell>
                    <TableCell>
                      {product.isDuplicate ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Duplicate
                        </Badge>
                      ) : (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          New
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {editingIndex === index ? (
                          <>
                            <Button size="sm" variant="ghost" onClick={saveEdit}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={cancelEdit}>
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => startEditing(index)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => removeProduct(index)}
                              className="text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableComponent>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
