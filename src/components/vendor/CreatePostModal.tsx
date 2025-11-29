import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImagePlus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  onSuccess: () => void;
}

export const CreatePostModal = ({ open, onOpenChange, storeId, onSuccess }: CreatePostModalProps) => {
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('product_showcase');
  const [uploading, setUploading] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setMediaFiles(Array.from(e.target.files).slice(0, 5));
    }
  };

  const uploadMedia = async () => {
    const urls: string[] = [];
    for (const file of mediaFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${storeId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      urls.push(publicUrl);
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please add some content to your post",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const mediaUrls = mediaFiles.length > 0 ? await uploadMedia() : [];

      const { error } = await supabase
        .from('vendor_posts')
        .insert({
          vendor_id: user.id,
          store_id: storeId,
          content,
          post_type: postType,
          media_urls: mediaUrls,
        });

      if (error) throw error;

      toast({
        title: "Post created!",
        description: "Your post has been shared successfully.",
      });

      setContent('');
      setMediaFiles([]);
      setPostType('product_showcase');
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create a Post</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Post Type</Label>
            <Select value={postType} onValueChange={setPostType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product_showcase">🛍️ Product Showcase</SelectItem>
                <SelectItem value="behind_scenes">🎬 Behind the Scenes</SelectItem>
                <SelectItem value="success_story">🎉 Success Story</SelectItem>
                <SelectItem value="announcement">📣 Announcement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea
              placeholder="Share your story with the community..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Media (Up to 5 images)</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('post-media')?.click()}
                className="w-full"
              >
                <ImagePlus className="h-4 w-4 mr-2" />
                Add Photos
              </Button>
              <input
                id="post-media"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            {mediaFiles.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {mediaFiles.length} file(s) selected
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={uploading || !content.trim()}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                'Share Post'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
