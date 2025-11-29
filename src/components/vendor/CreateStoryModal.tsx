import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImagePlus, Loader2, Zap, Package, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateStoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  onStoryCreated?: () => void;
}

export default function CreateStoryModal({ 
  open, 
  onOpenChange, 
  storeId,
  onStoryCreated 
}: CreateStoryModalProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [storyType, setStoryType] = useState<string>('regular');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!mediaFile) {
      toast({
        title: 'Media required',
        description: 'Please select an image or video',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload media
      const fileExt = mediaFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `stories/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, mediaFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      // Create story
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { error: storyError } = await supabase
        .from('vendor_stories')
        .insert({
          vendor_id: user.id,
          store_id: storeId,
          media_url: publicUrl,
          media_type: mediaFile.type.startsWith('video') ? 'video' : 'image',
          caption: caption || null,
          story_type: storyType,
          expires_at: expiresAt.toISOString(),
        });

      if (storyError) throw storyError;

      toast({
        title: 'Story posted!',
        description: 'Your story is now live for 24 hours',
      });

      onOpenChange(false);
      if (onStoryCreated) onStoryCreated();
      
      // Reset form
      setMediaFile(null);
      setMediaPreview(null);
      setCaption('');
      setStoryType('regular');
    } catch (error: any) {
      console.error('Error creating story:', error);
      toast({
        title: 'Error',
        description: 'Failed to post story',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Story</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Story Type</Label>
            <Select value={storyType} onValueChange={setStoryType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Regular Story
                  </div>
                </SelectItem>
                <SelectItem value="flash_sale">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Flash Sale
                  </div>
                </SelectItem>
                <SelectItem value="new_arrival">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    New Arrival
                  </div>
                </SelectItem>
                <SelectItem value="behind_scenes">
                  <div className="flex items-center gap-2">
                    <ImagePlus className="h-4 w-4" />
                    Behind the Scenes
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Media (Image or Video)</Label>
            <div className="relative">
              {mediaPreview ? (
                <div className="relative aspect-[9/16] rounded-lg overflow-hidden bg-muted">
                  {mediaFile?.type.startsWith('video') ? (
                    <video src={mediaPreview} className="w-full h-full object-cover" controls />
                  ) : (
                    <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setMediaFile(null);
                      setMediaPreview(null);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center aspect-[9/16] rounded-lg border-2 border-dashed border-border hover:border-primary cursor-pointer transition-colors">
                  <ImagePlus className="h-12 w-12 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Click to upload</span>
                  <Input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Caption (Optional)</Label>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption to your story..."
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={uploading || !mediaFile}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                'Post Story'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Stories are visible for 24 hours
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
