import { useState, useEffect, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'auto';
}

export const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  fallback = '/placeholder.svg',
  aspectRatio = 'auto'
}: LazyImageProps) => {
  const [imageSrc, setImageSrc] = useState<string>(fallback);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    auto: ''
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = new Image();
            img.src = src;
            img.onload = () => {
              setImageSrc(src);
              setIsLoading(false);
            };
            img.onerror = () => {
              setImageSrc(fallback);
              setIsLoading(false);
              setHasError(true);
            };
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image enters viewport
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src, fallback]);

  return (
    <div className={cn('relative overflow-hidden', aspectClasses[aspectRatio], className)}>
      {isLoading && !hasError && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          hasError && 'opacity-50'
        )}
        loading="lazy"
      />
    </div>
  );
};
