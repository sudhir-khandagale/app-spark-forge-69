import { useState, useEffect, useRef } from 'react';
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
 * OptimizedImage Component - Phase 1 Performance Enhancement
 * 
 * Features:
 * - WebP/AVIF format support with fallback
 * - Lazy loading with IntersectionObserver
 * - Responsive images with <picture> element
 * - Priority loading for hero/LCP images
 * - Skeleton loading state
 */
export const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  fallback = '/placeholder.svg',
  width,
  height,
  priority = false,
  sizes = '100vw'
}: OptimizedImageProps) => {
  const [imageSrc, setImageSrc] = useState<string>(priority ? src : fallback);
  const [isLoading, setIsLoading] = useState(!priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Generate WebP and AVIF versions of the image URL
  const getOptimizedSrc = (originalSrc: string, format: 'webp' | 'avif') => {
    if (originalSrc.startsWith('data:') || originalSrc.startsWith('blob:')) {
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
            };
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '100px', // Start loading 100px before entering viewport
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src, fallback, priority]);

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
          // @ts-ignore - fetchpriority is valid but not in TS types yet
          fetchpriority="high"
          decoding="async"
        />
      </picture>
    );
  }

  // For non-priority images, use lazy loading
  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <Skeleton className={`absolute inset-0 ${className}`} />
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
        />
      </picture>
    </div>
  );
};
