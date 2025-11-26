# Quick Implementation Guide - Using Phase 1 Optimizations

This guide shows you how to quickly apply Phase 1 optimizations across your app.

---

## 🚀 Step 1: Replace Images with OptimizedImage

### Before:
```tsx
<img src={product.image_url} alt={product.name} className="w-full h-48" />
```

### After:
```tsx
import { OptimizedImage } from '@/components/OptimizedImage';

<OptimizedImage 
  src={product.image_url} 
  alt={product.name} 
  className="w-full h-48"
  width={400}
  height={300}
  sizes="(max-width: 768px) 100vw, 400px"
/>
```

### For Hero/LCP Images:
```tsx
<OptimizedImage 
  src={heroImage} 
  alt="Hero Banner" 
  className="w-full h-[400px]"
  width={1200}
  height={600}
  priority  // Loads immediately, no lazy loading
  sizes="100vw"
/>
```

---

## 🎯 Step 2: Add SEO to Pages

### Example: Homepage (Index.tsx)

```tsx
import { SEOHead } from '@/components/SEOHead';
import { WebsiteStructuredData } from '@/components/StructuredData';

const Index = () => {
  return (
    <>
      <SEOHead
        title="Flowdux - Find Products in Local Stores"
        description="Search real-time inventory across local retailers. Compare prices and find products near you instantly."
        keywords={['local shopping', 'product search', 'nearby stores', 'price comparison']}
        type="website"
      />
      <WebsiteStructuredData />
      
      {/* Rest of your page */}
    </>
  );
};
```

### Example: Product Page (ProductDetails.tsx)

```tsx
import { SEOHead } from '@/components/SEOHead';
import { ProductStructuredData } from '@/components/StructuredData';

const ProductDetails = () => {
  const { product, store } = useProductData();
  
  return (
    <>
      <SEOHead
        title={`${product.name} - ${store.name}`}
        description={product.description || `Buy ${product.name} at ${store.name}. Check availability and price.`}
        keywords={[product.name, product.category, 'buy', store.name]}
        type="product"
        image={product.image_url}
      />
      <ProductStructuredData
        product={{
          id: product.id,
          name: product.name,
          description: product.description,
          image: product.image_url,
          price: inventory.price,
          rating: product.rating,
          reviewCount: product.review_count,
          availability: inventory.in_stock ? 'InStock' : 'OutOfStock',
        }}
        store={{
          name: store.name,
        }}
      />
      
      {/* Rest of your page */}
    </>
  );
};
```

### Example: Store Page (StoreProfile.tsx)

```tsx
import { SEOHead } from '@/components/SEOHead';
import { StoreStructuredData } from '@/components/StructuredData';

const StoreProfile = () => {
  const { store } = useStoreData();
  
  return (
    <>
      <SEOHead
        title={`${store.name} - Store Profile`}
        description={store.description || `Visit ${store.name}. View products, hours, and location.`}
        keywords={[store.name, 'local store', store.address, ...(store.specialties || [])]}
        type="website"
      />
      <StoreStructuredData
        store={{
          id: store.id,
          name: store.name,
          description: store.description,
          address: store.address,
          latitude: store.latitude,
          longitude: store.longitude,
          phone: store.phone,
          email: store.email,
          rating: store.rating,
          reviewCount: store.review_count,
          image: store.photo_urls?.[0],
        }}
      />
      
      {/* Rest of your page */}
    </>
  );
};
```

### Example: Search Page (Search.tsx)

```tsx
import { SEOHead } from '@/components/SEOHead';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  return (
    <>
      <SEOHead
        title={`Search Results for "${query}"`}
        description={`Find ${query} in local stores near you. Compare prices and availability across multiple retailers.`}
        keywords={[query, 'search', 'local stores', 'buy near me']}
        type="website"
        noindex={!query} // Don't index empty search pages
      />
      
      {/* Rest of your page */}
    </>
  );
};
```

---

## 🗺️ Step 3: Replace GoogleMap with LazyGoogleMap

### Before:
```tsx
import GoogleMap from '@/components/GoogleMap';

<GoogleMap
  center={{ lat: latitude, lng: longitude }}
  zoom={13}
  markers={storeMarkers}
/>
```

### After:
```tsx
import { LazyGoogleMap } from '@/components/LazyGoogleMap';

<LazyGoogleMap
  center={{ lat: latitude, lng: longitude }}
  zoom={13}
  markers={storeMarkers}
/>
```

That's it! The map will lazy load only when the component mounts, reducing initial bundle size.

---

## 📦 Step 4: Add Breadcrumbs for Navigation

```tsx
import { BreadcrumbStructuredData } from '@/components/StructuredData';

const ProductDetails = () => {
  return (
    <>
      <BreadcrumbStructuredData
        items={[
          { name: 'Home', url: 'https://app-spark-forge-69.lovable.app/' },
          { name: 'Search', url: 'https://app-spark-forge-69.lovable.app/search' },
          { name: product.name, url: `https://app-spark-forge-69.lovable.app/product/${product.id}` },
        ]}
      />
      
      {/* Visual breadcrumbs */}
      <nav className="flex gap-2 text-sm mb-4">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/search">Search</Link>
        <span>/</span>
        <span>{product.name}</span>
      </nav>
    </>
  );
};
```

---

## ✅ Quick Checklist

Apply these optimizations to each page:

### Homepage (`/`)
- [ ] Add `<SEOHead>` with homepage title and description
- [ ] Add `<WebsiteStructuredData />`
- [ ] Mark hero image with `priority` prop
- [ ] Use `OptimizedImage` for trending products

### Search Results (`/search`)
- [ ] Add `<SEOHead>` with dynamic search query
- [ ] Use `OptimizedImage` for product cards
- [ ] Add `noindex` for empty searches

### Product Details (`/product/:id`)
- [ ] Add `<SEOHead>` with product name
- [ ] Add `<ProductStructuredData>`
- [ ] Add `<BreadcrumbStructuredData>`
- [ ] Use `OptimizedImage` for product images

### Store Profile (`/store/:id`)
- [ ] Add `<SEOHead>` with store name
- [ ] Add `<StoreStructuredData>`
- [ ] Use `LazyGoogleMap` for store location
- [ ] Use `OptimizedImage` for store photos

### Map View (`/map`)
- [ ] Add `<SEOHead>`
- [ ] Use `LazyGoogleMap` for main map

### Shopping Lists (`/lists`, `/lists/:id`)
- [ ] Add `<SEOHead>`
- [ ] Use `OptimizedImage` for list item images

### Profile & Settings
- [ ] Add `<SEOHead>` with `noindex` (private pages)

---

## 🎨 Image Sizing Guide

Use these responsive image sizes for different components:

### Product Cards (Grid)
```tsx
<OptimizedImage
  src={product.image_url}
  alt={product.name}
  width={400}
  height={400}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  className="w-full aspect-square object-cover"
/>
```

### Hero Images
```tsx
<OptimizedImage
  src={heroImage}
  alt="Hero"
  width={1920}
  height={800}
  priority
  sizes="100vw"
  className="w-full h-[400px] object-cover"
/>
```

### Thumbnails
```tsx
<OptimizedImage
  src={thumbnail}
  alt="Thumbnail"
  width={80}
  height={80}
  sizes="80px"
  className="w-20 h-20 rounded-full"
/>
```

### Store Photos
```tsx
<OptimizedImage
  src={storePhoto}
  alt={store.name}
  width={800}
  height={600}
  sizes="(max-width: 768px) 100vw, 800px"
  className="w-full h-64 object-cover rounded-lg"
/>
```

---

## 🔍 Testing Your Changes

### 1. Check Console for Web Vitals
Open DevTools → Console, you should see:
```
[Web Vitals] {name: 'LCP', value: 2100, rating: 'good'}
[Web Vitals] {name: 'FCP', value: 1200, rating: 'good'}
```

### 2. Verify Images Load
- Open Network tab
- Filter by "Img"
- You should see `.webp` images being loaded
- Check image sizes are smaller than before

### 3. Check Structured Data
1. Open any page with structured data
2. View page source (Ctrl+U)
3. Search for `<script type="application/ld+json">`
4. Verify JSON-LD is present and valid

Or use Google's Rich Results Test:
https://search.google.com/test/rich-results

### 4. Run Lighthouse
```bash
npx lighthouse https://app-spark-forge-69.lovable.app --view
```

Look for improvements in:
- Performance score
- SEO score
- LCP metric
- Total bundle size

---

## 🎯 Priority Order

Implement in this order for maximum impact:

1. **Homepage** (highest traffic)
   - SEO + structured data
   - Hero image with priority
   - Trending products with OptimizedImage

2. **Search Results** (high traffic)
   - SEO with dynamic title
   - Product card images

3. **Product Details** (conversion page)
   - Full SEO + structured data
   - Breadcrumbs
   - All images optimized

4. **Store Profile** (conversion page)
   - Full SEO + structured data
   - Lazy Google Map
   - Store photos

5. **Map View** (heavy page)
   - Lazy Google Map
   - SEO

6. **Other Pages** (lower priority)
   - Shopping lists
   - Profile
   - Settings

---

## 📊 Expected Time Investment

| Task | Pages | Time per Page | Total Time |
|------|-------|---------------|------------|
| Add SEOHead | 10 pages | 5 min | 50 min |
| Add Structured Data | 3 pages | 10 min | 30 min |
| Replace images | 6 pages | 15 min | 90 min |
| Replace maps | 2 pages | 5 min | 10 min |
| Testing | - | - | 30 min |

**Total: ~3.5 hours** for complete implementation

---

## 🆘 Common Issues

### Images not showing WebP
- **Issue**: Browser doesn't support WebP
- **Solution**: Component automatically falls back to original format

### Structured data not in search results
- **Issue**: Takes 7-14 days for Google to process
- **Solution**: Wait and monitor Search Console

### Map not loading
- **Issue**: Lazy loading delay
- **Solution**: Normal behavior, skeleton shows during load

### SEO title not updating
- **Issue**: react-helmet-async not working
- **Solution**: Ensure `<HelmetProvider>` wraps your app in App.tsx

---

That's it! Follow this guide to quickly implement all Phase 1 optimizations across your app.
