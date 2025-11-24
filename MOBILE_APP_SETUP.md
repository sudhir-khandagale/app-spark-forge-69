# Flowdux - Native Mobile App Setup Guide

Your Flowdux app is now configured as a native mobile application using Capacitor! This allows you to build and deploy to iOS App Store and Google Play Store with full access to device features like GPS, camera, and native performance.

## ✅ What's Already Set Up

- ✅ Capacitor Core, CLI, iOS, and Android packages installed
- ✅ Capacitor configuration file created (`capacitor.config.ts`)
- ✅ Google Maps integration with native geolocation
- ✅ Hot-reload enabled for faster development
- ✅ Protected routes with authentication
- ✅ Form validation on reservations

## 🚀 Testing on Your Device or Emulator

### Step 1: Export to GitHub
1. Click the **"Export to GitHub"** button in Lovable
2. Clone the repository to your local machine:
   ```bash
   git clone <your-github-repo-url>
   cd <your-repo-name>
   ```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Add Native Platforms

**For iOS (requires Mac with Xcode):**
```bash
npx cap add ios
npx cap update ios
```

**For Android (requires Android Studio):**
```bash
npx cap add android
npx cap update android
```

### Step 4: Build the Web App
```bash
npm run build
```

### Step 5: Sync to Native Platform
After building, sync the web assets to your native platforms:
```bash
npx cap sync
```

**Important:** Run `npx cap sync` after every `git pull` to keep native platforms updated.

### Step 6: Run on Device/Emulator

**For iOS:**
```bash
npx cap run ios
```
This will open Xcode where you can:
- Select a simulator or physical device
- Click the Play button to build and run

**For Android:**
```bash
npx cap run android
```
This will open Android Studio where you can:
- Select an emulator or physical device
- Click the Run button to build and deploy

## 📱 Native Features Enabled

### 1. **Geolocation** (`@capacitor/geolocation`)
- Automatically requests location permissions
- Gets user's current position for map centering
- High accuracy GPS tracking
- Used in: `/map` route

### 2. **Google Maps Integration**
- Full Google Maps with markers
- Store locations with info windows
- Real-time user location
- Distance calculations
- Navigation support

### 3. **PWA Capabilities**
- Works offline (when deployed)
- Installable on home screen
- Fast loading with service workers

## 🗺️ Google Maps API Key

You've already added your Google Maps API key as `VITE_GOOGLE_MAPS_API_KEY`. 

**Important for Production:**
- Enable these APIs in Google Cloud Console:
  - Maps JavaScript API
  - Geolocation API
  - Places API
- Set up billing (required for Google Maps)
- Restrict your API key by:
  - Application (iOS bundle ID / Android package name)
  - Or by allowed URLs for web version

## 🔧 Development Tips

### Hot Reload (Already Configured)
Your `capacitor.config.ts` is set up to load from Lovable's preview URL:
```
https://871c9a98-d021-44e9-a2e6-d670157771eb.lovableproject.com
```

This means you can make changes in Lovable and see them instantly on your device without rebuilding!

### Switching to Production Build
When ready to deploy to app stores, update `capacitor.config.ts`:
```typescript
// Remove or comment out the server section
// server: {
//   url: '...',
//   cleartext: true
// }
```

Then rebuild and sync:
```bash
npm run build
npx cap sync
```

## 📋 Next Steps

1. **Test the Map View** (`/map` route)
   - Grant location permissions when prompted
   - See your current location on Google Maps
   - Click on store markers to see details

2. **Test Authentication**
   - Sign up for a new account
   - Protected routes redirect to login
   - Sign out functionality works

3. **Test Reservations**
   - Try to reserve a product
   - Form validation prevents invalid submissions
   - Data saves to Supabase backend

4. **Deploy to App Stores**
   - iOS: Follow [Apple's App Store guidelines](https://developer.apple.com/app-store/submissions/)
   - Android: Follow [Google Play Console guidelines](https://play.google.com/console/about/guides/releasewithconfidence/)

## 🆘 Troubleshooting

### Location Permission Denied
- iOS: Check Info.plist has location usage description
- Android: Check AndroidManifest.xml has location permissions

### Google Maps Not Loading
- Verify API key is correct in secrets
- Check Google Cloud Console has billing enabled
- Ensure Maps JavaScript API is enabled

### Build Errors
- Run `npm install` to ensure all dependencies are installed
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check you're using Node.js version 16 or higher

## 📚 Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [Lovable Blog: Capacitor Setup](https://lovable.dev/blog)

---

**Your app is ready to go native! 🎉**

Need help? Visit the Lovable Discord community or check out our blog post on mobile development.
