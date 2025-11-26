# Complete Monitoring Setup Guide

This guide walks you through the remaining steps to complete Phase 0 — Baseline & Instrumentation.

---

## ✅ Already Completed

1. ✅ **Web Vitals Tracking**: Automatically logs Core Web Vitals to console
2. ✅ **Sitemap**: Created at `/sitemap.xml`
3. ✅ **Robots.txt**: Verified and allows all crawlers
4. ✅ **Baseline Screenshots**: Captured key flows

---

## 🔧 Step-by-Step Setup

### 1. Run Lighthouse Audit (5 minutes)

**Option A: Chrome DevTools (Easiest)**
1. Open your app in Chrome: https://app-spark-forge-69.lovable.app
2. Press `F12` to open DevTools
3. Click "Lighthouse" tab
4. Select:
   - ✅ Performance
   - ✅ Accessibility
   - ✅ Best Practices
   - ✅ SEO
5. Choose "Mobile" device
6. Click "Analyze page load"
7. Save the report (Export JSON + HTML)

**Option B: CLI (For CI/CD)**
```bash
# Install globally
npm install -g lighthouse

# Run audit
lighthouse https://app-spark-forge-69.lovable.app \
  --output html \
  --output json \
  --output-path ./lighthouse-report \
  --view
```

**📊 Expected Baseline Scores:**
- Performance: 60-80 (before optimizations)
- Accessibility: 85-95
- Best Practices: 80-90
- SEO: 85-95

---

### 2. Run WebPageTest (10 minutes)

1. Visit: https://www.webpagetest.org/
2. Enter URL: `https://app-spark-forge-69.lovable.app`
3. Settings:
   - **Test Location**: Choose closest to target users (e.g., "Bangalore, India" or "Mumbai, India")
   - **Browser**: Chrome
   - **Connection**: 3G Fast (1.6 Mbps) or 4G (9 Mbps)
   - **Number of Tests**: 3 (for median values)
4. Click "Start Test"
5. Wait 2-5 minutes for results
6. Save:
   - Filmstrip view (visual progress)
   - Waterfall chart (resource loading)
   - Performance Summary

**📌 Key Metrics to Note:**
- First Byte Time (should be < 800ms)
- Start Render (should be < 1.5s)
- Speed Index (should be < 3s)
- Fully Loaded (should be < 5s on 4G)

---

### 3. Setup Google Analytics 4 (15 minutes)

**Create GA4 Property:**
1. Go to: https://analytics.google.com/
2. Click "Admin" (gear icon)
3. Click "Create Property"
4. Property name: "Flowdux PWA"
5. Select time zone and currency
6. Click "Next" → Choose "Web" → Click "Create stream"
7. Website URL: `https://app-spark-forge-69.lovable.app`
8. Stream name: "Flowdux Production"
9. Click "Create stream"

**Get Measurement ID:**
- You'll see a **Measurement ID** like `G-XXXXXXXXXX`
- Copy this ID

**Add to Your App:**
1. Open `index.html` in your project
2. Add **before** the closing `</head>` tag:

```html
<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX', {
    send_page_view: false // We'll send manually in React Router
  });
</script>
```

3. **Optional**: Update `WebVitalsReporter.tsx` to send metrics to GA4:

```typescript
function sendToAnalytics(metric: Metric) {
  console.log('[Web Vitals]', metric);
  
  // Send to GA4
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      metric_id: metric.id,
      metric_delta: metric.delta,
      metric_rating: metric.rating,
    });
  }
}
```

**Track Page Views in React Router:**
Add to `src/App.tsx` or create a hook:
```typescript
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    if (window.gtag) {
      window.gtag('config', 'G-XXXXXXXXXX', {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);
};
```

---

### 4. Setup Sentry Error Monitoring (10 minutes)

**Create Sentry Account:**
1. Go to: https://sentry.io/signup/
2. Sign up (free tier: 10,000 errors/month)
3. Create new project:
   - Platform: **React**
   - Project name: "Flowdux PWA"
4. Copy your **DSN** (looks like: `https://xxxxx@o0000.ingest.sentry.io/0000`)

**Install Sentry:**
```bash
npm install @sentry/react
```

**Configure Sentry:**

Update `src/main.tsx`:
```typescript
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import "./index.css";

// Initialize Sentry
Sentry.init({
  dsn: "YOUR_SENTRY_DSN_HERE",
  environment: import.meta.env.MODE, // 'development' or 'production'
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  
  // Performance Monitoring
  tracesSampleRate: 0.1, // Capture 10% of transactions for performance monitoring
  
  // Session Replay
  replaysSessionSampleRate: 0.1, // Sample 10% of sessions
  replaysOnErrorSampleRate: 1.0, // Capture 100% of sessions with errors
  
  // Filter out development errors
  beforeSend(event) {
    if (import.meta.env.MODE === 'development') {
      return null; // Don't send errors in development
    }
    return event;
  },
});

createRoot(document.getElementById("root")!).render(<App />);
```

**Test Sentry:**
Add a test error button anywhere:
```tsx
<button onClick={() => { throw new Error('Test Sentry Error'); }}>
  Test Error
</button>
```

---

### 5. Setup Google Search Console (15 minutes)

**Add Property:**
1. Go to: https://search.google.com/search-console
2. Click "Add property"
3. Choose **URL prefix**: `https://app-spark-forge-69.lovable.app`
4. Click "Continue"

**Verify Ownership (Choose One Method):**

**Method A: HTML File Upload (Easiest)**
1. Download the verification file from Search Console (e.g., `google1234567890abcdef.html`)
2. Place it in your `public/` folder
3. Commit and deploy
4. Click "Verify" in Search Console
5. After verification, you can remove the file

**Method B: HTML Tag**
1. Copy the meta tag from Search Console
2. Add to `index.html` in the `<head>` section:
```html
<meta name="google-site-verification" content="YOUR_VERIFICATION_CODE" />
```
3. Deploy and click "Verify"

**Method C: DNS TXT Record (If you control the domain)**
1. Add TXT record to DNS settings with the provided code
2. Wait for DNS propagation (can take up to 48 hours)
3. Click "Verify"

**Submit Sitemap:**
1. After verification, go to "Sitemaps" in the left menu
2. Enter: `https://app-spark-forge-69.lovable.app/sitemap.xml`
3. Click "Submit"
4. Status should show "Success" after processing (can take 1-2 days)

**Request Indexing for Key Pages:**
1. Go to "URL Inspection" in Search Console
2. Enter key URLs one by one:
   - `https://app-spark-forge-69.lovable.app/`
   - `https://app-spark-forge-69.lovable.app/search`
   - `https://app-spark-forge-69.lovable.app/map`
   - `https://app-spark-forge-69.lovable.app/auth`
3. Click "Request Indexing"
4. Repeat for each URL

---

### 6. Check Chrome UX Report (5 minutes)

**See Real User Data:**
1. Go to: https://developers.google.com/speed/pagespeed/insights/
2. Enter: `https://app-spark-forge-69.lovable.app`
3. Click "Analyze"
4. Look at "Discover what your real users are experiencing" section
5. Note the field data for:
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - First Input Delay (FID) / Interaction to Next Paint (INP)
   - Cumulative Layout Shift (CLS)

**Note**: Field data requires 28 days of real user traffic to appear.

---

### 7. Verify Web Vitals Logging (2 minutes)

**Check Console:**
1. Open your app: https://app-spark-forge-69.lovable.app
2. Open DevTools Console (F12)
3. Interact with the page (click, scroll, navigate)
4. You should see logs like:
```
[Web Vitals] {name: 'FCP', value: 1234.5, rating: 'good', ...}
[Web Vitals] {name: 'LCP', value: 2100.3, rating: 'good', ...}
[Web Vitals] {name: 'CLS', value: 0.05, rating: 'good', ...}
```

**✅ If you see these logs, Web Vitals tracking is working!**

---

### 8. Create Issues Backlog (20 minutes)

**Setup GitHub Issues:**
1. Go to your repo: https://github.com/YOUR_USERNAME/YOUR_REPO
2. Click "Issues" tab
3. Create labels:
   - 🔴 `P0-Critical` - Blocking issues
   - 🟡 `P1-High` - Performance impacts
   - 🟢 `P2-Medium` - UX improvements
   - 🔵 `P3-Low` - Nice-to-haves
   - 🚀 `performance`
   - 🎨 `ux`
   - 🔍 `seo`
   - ♿ `accessibility`

**Review Audit Results:**
From Lighthouse and WebPageTest, create issues for:
- Any metric in "red" (poor)
- Warnings from Lighthouse
- Accessibility violations
- SEO recommendations
- Loading bottlenecks from waterfall

**Example Issues to Create:**
```markdown
## Issue: Optimize LCP (Hero Image Loading)
**Priority**: P1-High
**Category**: Performance

**Current State**: LCP = 3.2s (needs improvement)
**Target**: LCP < 2.5s

**Root Cause**: Hero image is 1.2MB PNG, loaded after CSS

**Solution**:
- [ ] Convert to WebP format
- [ ] Add preload tag for hero image
- [ ] Implement responsive images
- [ ] Add lazy loading for below-fold images

**Estimated Impact**: -1.5s LCP
```

---

## 📊 Acceptance Checklist

- [ ] Lighthouse reports saved (mobile + desktop)
- [ ] WebPageTest filmstrip captured
- [ ] GA4 configured and tracking page views
- [ ] Sentry configured and capturing errors
- [ ] Search Console verified
- [ ] Sitemap submitted to Search Console
- [ ] Web Vitals logging in console
- [ ] GitHub issues backlog created
- [ ] Top 10 priority issues documented

---

## 🎯 What's Next?

After completing Phase 0, proceed to:

**Phase 1 — Performance & SEO Quick Wins**
- Image optimization (WebP conversion)
- Remove render-blocking resources
- Add preconnect/preload tags
- Implement lazy loading
- Add structured data (Schema.org)

**Phase 2 — Mobile UX & Navigation**
- Optimize thumb-zone navigation
- Improve form UX
- Add skeleton loaders
- Enhance accessibility

---

## 💡 Pro Tips

1. **Automate Lighthouse in CI/CD**: Run Lighthouse on every deploy to catch regressions early
2. **Set Budget Alerts**: Configure performance budgets in Lighthouse CI
3. **Monitor Weekly**: Check GA4 and Search Console weekly for trends
4. **A/B Test Changes**: Use feature flags to test performance improvements
5. **Document Everything**: Keep a changelog of all optimization changes

---

## 🆘 Troubleshooting

**Issue: Sitemap not appearing in Search Console**
- Wait 24-48 hours for initial processing
- Check that `/sitemap.xml` is publicly accessible
- Verify no robots.txt rules are blocking Googlebot

**Issue: GA4 not tracking page views**
- Check browser console for errors
- Verify Measurement ID is correct
- Make sure ad blockers are disabled during testing

**Issue: Sentry not capturing errors**
- Check DSN is correct
- Verify you're not in development mode filter
- Try the test error button
- Check Sentry dashboard filters

**Issue: Web Vitals not logging**
- Open console before page load
- Navigate between pages to trigger metrics
- Check if `web-vitals` package is installed
- Verify `WebVitalsReporter` is mounted in App.tsx

---

## 📞 Need Help?

- **Lighthouse Issues**: https://github.com/GoogleChrome/lighthouse/issues
- **GA4 Community**: https://support.google.com/analytics/community
- **Sentry Docs**: https://docs.sentry.io/platforms/javascript/guides/react/
- **Search Console Help**: https://support.google.com/webmasters/

---

**Last Updated**: 2025-11-26  
**Next Review**: After completing Phase 1
