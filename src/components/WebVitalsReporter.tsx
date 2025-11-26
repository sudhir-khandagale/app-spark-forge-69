import { useEffect } from 'react';
import { onCLS, onLCP, onFCP, onTTFB, onINP, Metric } from 'web-vitals';

/**
 * Web Vitals Reporter Component
 * 
 * Tracks Core Web Vitals and sends them to analytics endpoint.
 * For Phase 0 baseline measurements.
 * 
 * Metrics tracked:
 * - LCP (Largest Contentful Paint): < 2.5s (Good)
 * - INP (Interaction to Next Paint): < 200ms (Good) - Replaced FID in web-vitals v3
 * - CLS (Cumulative Layout Shift): < 0.1 (Good)
 * - FCP (First Contentful Paint): < 1.8s (Good)
 * - TTFB (Time to First Byte): < 800ms (Good)
 */

function sendToAnalytics(metric: Metric) {
  // Log to console for Phase 0 baseline measurement
  console.log('[Web Vitals]', {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
  });

  // TODO: Send to analytics service (GA4, Google Analytics, etc.)
  // Example for GA4:
  // if (window.gtag) {
  //   window.gtag('event', metric.name, {
  //     value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
  //     metric_id: metric.id,
  //     metric_value: metric.value,
  //     metric_delta: metric.delta,
  //   });
  // }

  // Can also send to custom endpoint:
  // fetch('/api/analytics', {
  //   method: 'POST',
  //   body: JSON.stringify(metric),
  //   headers: { 'Content-Type': 'application/json' },
  // });
}

export const WebVitalsReporter = () => {
  useEffect(() => {
    // Report all Web Vitals metrics
    onCLS(sendToAnalytics);
    onLCP(sendToAnalytics);
    onFCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
    onINP(sendToAnalytics); // Replaces FID in web-vitals v3+
  }, []);

  return null; // This component doesn't render anything
};
