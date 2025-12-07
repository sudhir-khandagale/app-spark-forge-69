import { useState, useEffect, useRef, memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
  width?: number;
  height?: number;
  priority?: boolean; // For LCP images (hero images)
  sizes?: string; // Responsive image sizes
}

/**
 * OptimizedImage Component - Performance Enhanced
 * 
 * Features:
 * - WebP/AVIF format support with fallback
 * - Lazy loading with IntersectionObserver
 * - Responsive images with <picture> element
 * - Priority loading for hero/LCP images
 * - Skeleton loading state with explicit dimensions
 * - Memoized to prevent unnecessary re-renders
 */
export const OptimizedImage = memo(({ 
  src, 
  alt, 
  className = '', 
  fallback = '/placeholder.svg',
  width = 300,
  height = 300,
  priority = false,
  sizes = '100vw'
}: OptimizedImageProps) => {
  const [imageSrc, setImageSrc] = useState<string>(priority ? src : fallback);
  const [isLoading, setIsLoading] = useState(!priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Generate WebP and AVIF versions of the image URL
  const getOptimizedSrc = (originalSrc: string, format: 'webp' | 'avif') => {
    if (!originalSrc || originalSrc.startsWith('data:') || originalSrc.startsWith('blob:')) {
      return null; // Can't optimize data URLs
    }
    
    // For Supabase storage URLs, we can add transformation parameters
    if (originalSrc.includes('supabase')) {
      try {
        const url = new URL(originalSrc);
        url.searchParams.set('format', format);
        if (width) url.searchParams.set('width', width.toString());
        return url.toString();
      } catch {
        return null;
      }
    }
    
    // For other URLs, attempt to replace extension
    const extensionRegex = /\.(jpg|jpeg|png)$/i;
    if (extensionRegex.test(originalSrc)) {
      return originalSrc.replace(extensionRegex, `.${format}`);
    }
    
    return null;
  };

  const webpSrc = getOptimizedSrc(src, 'webp');
  const avifSrc = getOptimizedSrc(src, 'avif');

  useEffect(() => {
    // Priority images load immediately
    if (priority) {
      setIsLoading(false);
      return;
    }

    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
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
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: '200px', // Start loading 200px before entering viewport
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [src, fallback, priority]);

  // Handle image load error
  const handleError = () => {
    if (!hasError) {
      setImageSrc(fallback);
      setHasError(true);
    }
  };

  // For priority images, use regular img with fetchpriority
  if (priority) {
    return (
      <picture>
        {avifSrc && <source srcSet={avifSrc} type="image/avif" sizes={sizes} />}
        {webpSrc && <source srcSet={webpSrc} type="image/webp" sizes={sizes} />}
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={className}
          fetchPriority="high"
          decoding="async"
          onError={handleError}
          style={{ contentVisibility: 'auto' }}
        />
      </picture>
    );
  }

  // For non-priority images, use lazy loading with explicit dimensions
  return (
    <div 
      className={`relative ${className}`} 
      style={{ width: width || 'auto', height: height || 'auto', minHeight: height }}
    >
      {isLoading && (
        <Skeleton 
          className="absolute inset-0" 
          style={{ width: '100%', height: '100%' }}
        />
      )}
      <picture>
        {avifSrc && <source srcSet={avifSrc} type="image/avif" sizes={sizes} />}
        {webpSrc && <source srcSet={webpSrc} type="image/webp" sizes={sizes} />}
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          loading="lazy"
          decoding="async"
          onError={handleError}
          style={{ contentVisibility: 'auto' }}
        />
      </picture>
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';
