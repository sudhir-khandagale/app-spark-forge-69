import { Badge } from '@/components/ui/badge';
import { Zap, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { formatPrice } from '@/lib/utils';

interface FlashSaleBadgeProps {
  originalPrice: number;
  salePrice: number;
  discountPercentage: number;
  endsAt: string;
  size?: 'sm' | 'md' | 'lg';
  showTimer?: boolean;
}

export default function FlashSaleBadge({ 
  originalPrice, 
  salePrice, 
  discountPercentage, 
  endsAt,
  size = 'md',
  showTimer = true
}: FlashSaleBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs py-0.5 px-2',
    md: 'text-sm py-1 px-3',
    lg: 'text-base py-1.5 px-4'
  };

  return (
    <div className="space-y-1">
      <Badge 
        className={`bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold ${sizeClasses[size]} animate-pulse`}
      >
        <Zap className="h-3 w-3 mr-1 fill-current" />
        {discountPercentage}% OFF
      </Badge>
      
      <div className="flex items-center gap-2">
        <span className={`text-muted-foreground line-through ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          {formatPrice(originalPrice)}
        </span>
        <span className={`font-bold text-primary ${size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : 'text-2xl'}`}>
          {formatPrice(salePrice)}
        </span>
      </div>
      
      {showTimer && (
        <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
          <Clock className="h-3 w-3" />
          <span>Ends {formatDistanceToNow(new Date(endsAt), { addSuffix: true })}</span>
        </div>
      )}
    </div>
  );
}
