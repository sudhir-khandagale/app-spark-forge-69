import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load the GoogleMap component to reduce initial bundle size
const GoogleMap = lazy(() => import('./GoogleMap'));

interface LazyGoogleMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    position: { lat: number; lng: number };
    title: string;
    storeName: string;
    price?: string;
    inStock?: boolean;
  }>;
  onMarkerClick?: (marker: any) => void;
}

/**
 * LazyGoogleMap - Lazy-loaded wrapper for GoogleMap component
 * 
 * Phase 1 Performance Enhancement:
 * - Lazy loads Google Maps API only when needed
 * - Reduces initial bundle size by ~150KB
 * - Shows skeleton loader while loading
 */
export const LazyGoogleMap = (props: LazyGoogleMapProps) => {
  return (
    <Suspense 
      fallback={
        <div className="w-full h-full">
          <Skeleton className="w-full h-full" />
        </div>
      }
    >
      <GoogleMap {...props} />
    </Suspense>
  );
};

export default LazyGoogleMap;
