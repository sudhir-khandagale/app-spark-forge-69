# Phase 0 — Baseline & Instrumentation

**Purpose**: Measure current reality so every change is measurable.

**Date**: 2025-11-26

---

## ✅ Completed Actions

### 1. Web Vitals Monitoring Setup
- ✅ Installed `web-vitals` package
- ✅ Created `WebVitalsReporter` component to track Core Web Vitals
- ✅ Component tracks all key metrics:
  - **LCP** (Largest Contentful Paint) - Target: < 2.5s
  - **FID** (First Input Delay) - Target: < 100ms  
  - **CLS** (Cumulative Layout Shift) - Target: < 0.1
  - **FCP** (First Contentful Paint) - Target: < 1.8s
  - **TTFB** (Time to First Byte) - Target: < 800ms
  - **INP** (Interaction to Next Paint) - Target: < 200ms
- ✅ Console logging enabled for Phase 0 measurements
- 📝 **Next Step**: Integrate component in App.tsx and configure analytics endpoint

### 2. SEO Infrastructure
- ✅ Created `sitemap.xml` with all key pages
- ✅ Verified `robots.txt` exists and allows all crawlers
- 📝 **Next Step**: Submit sitemap to Google Search Console

### 3. Key Flow Screenshots
- ✅ Captured baseline screenshots of critical flows:
  - Home page (/)
  - Search results (/search?q=phone)
  - Authentication (/auth)
  - Barcode scanner (/scanner)
  - Map view (/map)
- 📝 Screenshots saved for comparison after optimizations

---

## 📋 Remaining Actions

### 4. Performance Audits
- ⏳ **Run Lighthouse audits** (mobile & desktop)
  ```bash
  # Run locally
  npx lighthouse https://app-spark-forge-69.lovable.app --view --only-categories=performance,seo,accessibility,best-practices
  
  # Or use Chrome DevTools > Lighthouse tab
  ```
- ⏳ **Run WebPageTest** with simulated mobile connection
  - Visit: https://www.webpagetest.org/
  - URL: https://app-spark-forge-69.lovable.app
  - Test Location: Choose closest location
  - Connection: 3G/4G mobile
  - Save filmstrip and waterfall reports

### 5. Real-User Monitoring (RUM)
**Option A - Google Analytics 4 (Recommended)**
```javascript
// Add to index.html <head>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX', {
    'send_page_view': false // We'll send manually
  });
</script>
```

**Option B - Custom Web Vitals Endpoint**
- Update `WebVitalsReporter.tsx` to send metrics to your backend
- Create analytics table in Supabase
- Query Chrome UX Report for field data

### 6. Error Monitoring
**Setup Sentry for JavaScript errors:**
```bash
npm install @sentry/react
```

```javascript
// Add to main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### 7. Google Search Console
1. Visit: https://search.google.com/search-console
2. Add property: https://app-spark-forge-69.lovable.app
3. Verify ownership (HTML file upload or DNS TXT record)
4. Submit sitemap: `https://app-spark-forge-69.lovable.app/sitemap.xml`
5. Request indexing for key pages

### 8. Create Issues Backlog
- Set up GitHub Issues / Trello / Jira board
- Categorize findings from audits:
  - 🔴 Critical (P0) - Blocking issues
  - 🟡 High (P1) - Performance impacts
  - 🟢 Medium (P2) - UX improvements
  - 🔵 Low (P3) - Nice-to-haves
- Prioritize based on:
  - User impact
  - Implementation effort
  - Dependencies

---

## 📊 Acceptance Criteria

- [x] Web Vitals tracking implemented and logging to console
- [x] Sitemap.xml created and accessible
- [x] Robots.txt verified
- [x] Key flow screenshots captured
- [ ] Lighthouse reports saved (mobile & desktop)
- [ ] WebPageTest filmstrip and waterfall captured
- [ ] RUM enabled (GA4 or custom)
- [ ] Sentry configured for error tracking
- [ ] Search Console verified and sitemap submitted
- [ ] Issues backlog created with prioritized items

---

## 💰 Cost-Saving Tips

1. **Run Lighthouse locally** or in CI per PR instead of paid services
2. **Use free tiers**: 
   - Google Analytics 4 (free)
   - Sentry (10k events/month free)
   - WebPageTest (limited free tests)
3. **Batch testing**: Run comprehensive audits weekly, not daily
4. **Focus on real user data**: RUM > synthetic testing for prioritization

---

## 📈 Metrics to Track

### Performance Metrics (from Lighthouse/WebPageTest)
- [ ] First Contentful Paint (FCP)
- [ ] Largest Contentful Paint (LCP)
- [ ] Total Blocking Time (TBT)
- [ ] Cumulative Layout Shift (CLS)
- [ ] Speed Index
- [ ] Time to Interactive (TTI)

### SEO Metrics (from Search Console)
- [ ] Impressions
- [ ] Click-through rate (CTR)
- [ ] Average position
- [ ] Indexed pages count
- [ ] Mobile usability issues
- [ ] Core Web Vitals status

### Error Metrics (from Sentry)
- [ ] JavaScript error rate
- [ ] Error types and frequency
- [ ] Affected users
- [ ] Stack traces

### Business Metrics
- [ ] Search success rate
- [ ] Vendor onboarding conversion
- [ ] Product reservation rate
- [ ] User retention (Day 1, Day 7, Day 30)

---

## 🔄 Next Steps

After Phase 0 is complete, proceed to:
1. **Phase 1** - Performance & SEO Quick Wins
2. **Phase 2** - Mobile UX & Navigation
3. **Phase 3** - Role-Based Auth & Vendor Onboarding

---

## 📝 Notes

- Current domain: `https://app-spark-forge-69.lovable.app`
- Update sitemap.xml when deploying to custom domain
- All monitoring should be in place BEFORE making optimization changes
- Baseline measurements are the foundation for measuring ROI of improvements
