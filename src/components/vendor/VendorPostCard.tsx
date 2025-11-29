import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, MoreVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

interface VendorPostCardProps {
  post: {
    id: string;
    content: string;
    media_urls: string[];
    post_type: string;
    likes_count: number;
    comments_count: number;
    created_at: string;
    store?: {
      name: string;
      photo_urls: string[];
    };
    profile?: {
      display_name: string;
      avatar_url: string;
    };
  };
  onLike: (postId: string) => void;
}

export const VendorPostCard = ({ post, onLike }: VendorPostCardProps) => {
  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'product_showcase': return 'bg-primary/10 text-primary';
      case 'behind_scenes': return 'bg-secondary/10 text-secondary-foreground';
      case 'success_story': return 'bg-accent/10 text-accent-foreground';
      default: return 'bg-muted';
    }
  };

  const getPostTypeLabel = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarImage src={post.profile?.avatar_url || post.store?.photo_urls?.[0]} />
              <AvatarFallback>{post.store?.name?.[0] || 'V'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{post.profile?.display_name || post.store?.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPostTypeColor(post.post_type)}`}>
              {getPostTypeLabel(post.post_type)}
            </span>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Media */}
        {post.media_urls && post.media_urls.length > 0 && (
          <div className="relative aspect-square bg-muted">
            <img
              src={post.media_urls[0]}
              alt="Post media"
              className="w-full h-full object-cover"
            />
            {post.media_urls.length > 1 && (
              <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs">
                +{post.media_urls.length - 1}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-4 space-y-3">
          <p className="text-sm leading-relaxed">{post.content}</p>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 hover:text-red-500"
              onClick={() => onLike(post.id)}
            >
              <Heart className="h-5 w-5" />
              <span className="text-sm font-medium">{post.likes_count}</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{post.comments_count}</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-2 ml-auto">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
