import { useState, useCallback, useRef } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userId: string;
  onUploadComplete: (url: string) => void;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  // Set canvas size to cropped size
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Compress and convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      0.85 // Compression quality
    );
  });
}

export const AvatarUpload = ({ currentAvatarUrl, userId, onUploadComplete }: AvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB",
          variant: "destructive"
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result as string);
        setShowCropDialog(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setUploading(true);
    try {
      // Crop and compress the image
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

      // Delete old avatar if exists
      if (currentAvatarUrl) {
        const oldPath = currentAvatarUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${userId}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const fileName = `avatar-${Date.now()}.jpg`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, croppedBlob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Profile picture updated successfully"
      });

      onUploadComplete(publicUrl);
      setShowCropDialog(false);
      setImageSrc(null);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload profile picture",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!currentAvatarUrl) return;

    setUploading(true);
    try {
      const oldPath = currentAvatarUrl.split('/').pop();
      if (oldPath) {
        await supabase.storage
          .from('avatars')
          .remove([`${userId}/${oldPath}`]);
      }

      await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId);

      toast({
        title: "Success",
        description: "Profile picture removed"
      });

      onUploadComplete('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove profile picture",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-4">
        <Avatar className="w-24 h-24">
          <AvatarImage src={currentAvatarUrl || undefined} />
          <AvatarFallback className="text-2xl">
            <Upload className="w-8 h-8" />
          </AvatarFallback>
        </Avatar>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            {currentAvatarUrl ? 'Change' : 'Upload'}
          </Button>

          {currentAvatarUrl && (
            <Button
              variant="outline"
              onClick={handleRemove}
              disabled={uploading}
            >
              <X className="w-4 h-4 mr-2" />
              Remove
            </Button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crop Profile Picture</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
              {imageSrc && (
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Zoom</Label>
              <Slider
                value={[zoom]}
                onValueChange={(value) => setZoom(value[0])}
                min={1}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCropDialog(false);
                setImageSrc(null);
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};