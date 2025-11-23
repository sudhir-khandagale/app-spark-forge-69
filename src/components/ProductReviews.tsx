import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  photo_urls: string[] | null;
  created_at: string;
}

interface ProductReviewsProps {
  productId: string;
  refreshTrigger?: number;
}

export default function ProductReviews({ productId, refreshTrigger }: ProductReviewsProps) {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, [productId, refreshTrigger]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately
      if (data && data.length > 0) {
        const userIds = data.map(r => r.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', userIds);

        const reviewsWithProfiles = data.map(review => ({
          ...review,
          display_name: profiles?.find(p => p.id === review.user_id)?.display_name || null
        }));

        setReviews(reviewsWithProfiles as any);
        
        const avg = data.reduce((sum, review) => sum + review.rating, 0) / data.length;
        setAverageRating(avg);
      } else {
        setReviews([]);
      }
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reviews',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Customer Reviews</CardTitle>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{averageRating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({reviews.length} reviews)</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {reviews.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No reviews yet. Be the first to review this product!
          </p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b last:border-b-0 pb-6 last:pb-0">
              <div className="flex items-start gap-4">
                <Avatar>
                  <AvatarFallback>
                    {((review as any).display_name?.charAt(0).toUpperCase()) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {(review as any).display_name || 'Anonymous'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {renderStars(review.rating)}
                  </div>
                  {review.comment && (
                    <p className="text-foreground/90">{review.comment}</p>
                  )}
                  {review.photo_urls && review.photo_urls.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {review.photo_urls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Review photo ${index + 1}`}
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
