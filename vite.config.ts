import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Build identifier for automatic cache-busting (changes every production build)
  define: {
    __FLOWDUX_BUILD_ID__: JSON.stringify(
      mode === 'production' ? new Date().toISOString() : 'dev'
    ),
  },
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      // Defer service worker registration to avoid render-blocking
      injectRegister: 'script-defer',
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Flowdux - Find Products in Local Stores',
        short_name: 'Flowdux',
        description: 'Find products in local stores instantly. Search real-time inventory, compare prices, and navigate to retailers with items in stock.',
        theme_color: '#6C5CE7',
        background_color: '#F8F9FE',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webp}'],
        // Increase cache size for better offline experience
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        runtimeCaching: [
          {
            // Cache Google Fonts CSS
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache Google Fonts files
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-files',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache Supabase API requests
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache images from Supabase Storage
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache Google Maps API
            urlPattern: /^https:\/\/maps\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'maps-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Enhanced code splitting for better caching and smaller initial bundle
        manualChunks: (id) => {
          // Core React - most critical
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react-core';
          }
          // Router - needed for navigation
          if (id.includes('react-router')) {
            return 'vendor-router';
          }
          // React Query - data fetching
          if (id.includes('@tanstack/react-query')) {
            return 'vendor-query';
          }
          // Supabase - backend
          if (id.includes('@supabase')) {
            return 'vendor-supabase';
          }
          // Radix UI - split by component for better tree-shaking
          if (id.includes('@radix-ui/react-dialog') || id.includes('@radix-ui/react-dropdown-menu')) {
            return 'ui-dialogs';
          }
          if (id.includes('@radix-ui/react-select') || id.includes('@radix-ui/react-tabs')) {
            return 'ui-forms';
          }
          if (id.includes('@radix-ui/react-toast') || id.includes('@radix-ui/react-tooltip')) {
            return 'ui-feedback';
          }
          if (id.includes('@radix-ui')) {
            return 'ui-radix-other';
          }
          // Icons - separate chunk
          if (id.includes('lucide-react')) {
            return 'ui-icons';
          }
          // Charts - lazy loaded
          if (id.includes('recharts')) {
            return 'vendor-charts';
          }
          // Animation
          if (id.includes('framer-motion')) {
            return 'vendor-motion';
          }
          // Maps - lazy loaded
          if (id.includes('@googlemaps') || id.includes('google.maps')) {
            return 'vendor-maps';
          }
          // QR code - lazy loaded
          if (id.includes('qrcode')) {
            return 'vendor-qr';
          }
          // Date utilities
          if (id.includes('date-fns')) {
            return 'vendor-date';
          }
          // Form handling
          if (id.includes('react-hook-form') || id.includes('zod')) {
            return 'vendor-forms';
          }
        },
        // Add hash to filenames for cache busting
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 500, // Warn on smaller chunks
    minify: 'terser',
    terserOptions: {
      compress: {
        // TEMPORARILY DISABLED: Keep console logs for debugging white screen issue
        drop_console: false,
        drop_debugger: mode === 'production',
        // Additional compression for smaller bundles
        passes: 3,
        // TEMPORARILY DISABLED: Keep console functions for debugging
        pure_funcs: [],
        dead_code: true,
        unused: true,
      },
      mangle: {
        safari10: true, // Fix Safari 10 issues
      },
      format: {
        comments: false, // Remove all comments
      },
    },
    // Enable compression
    cssCodeSplit: true,
    sourcemap: mode !== 'production',
    // Faster builds
    reportCompressedSize: false,
    // Target modern browsers for smaller bundles
    target: 'es2020',
  },
}));
