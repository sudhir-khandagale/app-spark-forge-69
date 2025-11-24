import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Star, X, ImagePlus, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { compressImage, formatFileSize } from '@/lib/imageCompression';

interface ProductReviewFormProps {
  productId: string;
  storeId: string;
  onReviewSubmitted?: () => void;
}

export default function ProductReviewForm({ productId, storeId, onReviewSubmitted }: ProductReviewFormProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [photoSizes, setPhotoSizes] = useState<{ original: number; compressed: number }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [compressing, setCompressing] = useState(false);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setCompressing(true);
    try {
      const maxSize = 200 * 1024; // 200KB
      const compressedFiles: File[] = [];
      const sizesInfo: { original: number; compressed: number }[] = [];

      for (const file of files) {
        // Check if file is an image
        if (!file.type.startsWith('image/')) {
          toast({
            title: 'Invalid File',
            description: `${file.name} is not an image`,
            variant: 'destructive',
          });
          continue;
        }

        const originalSize = file.size;
        
        try {
          // Compress the image
          const compressedFile = await compressImage(file, 200);
          const compressedSize = compressedFile.size;
          
          compressedFiles.push(compressedFile);
          sizesInfo.push({ original: originalSize, compressed: compressedSize });
          
          // Show compression info if size was reduced significantly
          if (originalSize > maxSize) {
            const savedPercent = Math.round(((originalSize - compressedSize) / originalSize) * 100);
            toast({
              title: 'Image Compressed',
              description: `${file.name}: ${formatFileSize(originalSize)} → ${formatFileSize(compressedSize)} (${savedPercent}% smaller)`,
            });
          }
        } catch (error) {
          console.error('Compression error:', error);
          toast({
            title: 'Compression Failed',
            description: `Failed to compress ${file.name}`,
            variant: 'destructive',
          });
        }
      }

      if (compressedFiles.length === 0) return;

      const newFiles = [...photoFiles, ...compressedFiles].slice(0, 3);
      const newSizes = [...photoSizes, ...sizesInfo].slice(0, 3);
      setPhotoFiles(newFiles);
      setPhotoSizes(newSizes);

      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPhotoPreviews(newPreviews);
    } finally {
      setCompressing(false);
    }
  };

  const removePhoto = (index: number) => {
    const newFiles = photoFiles.filter((_, i) => i !== index);
    const newPreviews = photoPreviews.filter((_, i) => i !== index);
    const newSizes = photoSizes.filter((_, i) => i !== index);
    setPhotoFiles(newFiles);
    setPhotoPreviews(newPreviews);
    setPhotoSizes(newSizes);
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (photoFiles.length === 0) return [];

    const uploadedUrls: string[] = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      for (const file of photoFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('review-photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('review-photos')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload some photos',
        variant: 'destructive',
      });
    }

    return uploadedUrls;
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: 'Rating Required',
        description: 'Please select a rating',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const photoUrls = await uploadPhotos();

      const { error } = await supabase
        .from('product_reviews')
        .insert({
          user_id: user.id,
          product_id: productId,
          store_id: storeId,
          rating,
          comment: comment.trim() || null,
          photo_urls: photoUrls.length > 0 ? photoUrls : null,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Your review has been submitted. You earned 10 points! 🎉',
      });

      setOpen(false);
      setRating(0);
      setComment('');
      setPhotoFiles([]);
      setPhotoPreviews([]);
      setPhotoSizes([]);
      onReviewSubmitted?.();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit review',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">Write a Review</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Write a Product Review</DialogTitle>
          <DialogDescription>Share your experience with this product</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Rating *</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Your Review</Label>
            <Textarea
              id="comment"
              placeholder="Tell others about your experience with this product..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">{comment.length}/1000 characters</p>
          </div>

          <div className="space-y-2">
            <Label>Photos (up to 3, max 200KB each)</Label>
            <div className="space-y-3">
              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photoPreviews.map((preview, index) => {
                    const sizeInfo = photoSizes[index];
                    const wasCompressed = sizeInfo && sizeInfo.original > sizeInfo.compressed;
                    const savedPercent = wasCompressed 
                      ? Math.round(((sizeInfo.original - sizeInfo.compressed) / sizeInfo.original) * 100)
                      : 0;
                    
                    return (
                      <div key={index} className="relative">
                        <div className="aspect-square">
                          <img
                            src={preview}
                            alt={`Review photo ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 z-10"
                            onClick={() => removePhoto(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        {sizeInfo && (
                          <div className="mt-1 space-y-0.5">
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(sizeInfo.compressed)}
                            </p>
                            {wasCompressed && (
                              <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                                ↓ {savedPercent}% smaller
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {photoFiles.length < 3 && (
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoChange}
                    disabled={photoFiles.length >= 3 || compressing}
                    className="flex-1"
                  />
                  {compressing ? (
                    <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                  ) : (
                    <ImagePlus className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {photoFiles.length}/3 photos • Auto-compressed to ≤200KB
                {compressing && ' • Compressing...'}
              </p>
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={submitting || rating === 0} className="w-full">
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
