import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FavoriteStoreButtonProps {
  storeId: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
}

const FavoriteStoreButton = ({ 
  storeId, 
  variant = 'ghost', 
  size = 'icon',
  className,
  showLabel = false 
}: FavoriteStoreButtonProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndFavoriteStatus();
  }, [storeId]);

  const checkAuthAndFavoriteStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAuthenticated(false);
        return;
      }

      setIsAuthenticated(true);

      const { data } = await supabase
        .from('favorite_stores')
        .select('id')
        .eq('user_id', user.id)
        .eq('store_id', storeId)
        .maybeSingle();

      setIsFavorite(!!data);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast({
        title: 'Login Required',
        description: 'Please login to save favorite stores',
      });
      navigate('/auth');
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isFavorite) {
        const { error } = await supabase
          .from('favorite_stores')
          .delete()
          .eq('user_id', user.id)
          .eq('store_id', storeId);

        if (error) throw error;

        setIsFavorite(false);
        toast({
          title: 'Removed from favorites',
          description: 'Store removed from your favorites',
        });
      } else {
        const { error } = await supabase
          .from('favorite_stores')
          .insert({ user_id: user.id, store_id: storeId });

        if (error) throw error;

        setIsFavorite(true);
        toast({
          title: 'Added to favorites',
          description: 'Store added to your favorites',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update favorites',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={cn(
        'transition-all',
        isFavorite && 'text-yellow-500 hover:text-yellow-600',
        className
      )}
    >
      <Star
        className={cn(
          'w-5 h-5',
          isFavorite && 'fill-current',
          showLabel && 'mr-2'
        )}
      />
      {showLabel && (isFavorite ? 'Favorite Store' : 'Add to Favorites')}
    </Button>
  );
};

export default FavoriteStoreButton;
