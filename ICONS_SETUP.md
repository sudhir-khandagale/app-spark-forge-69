# Flowdux App Icons & Splash Screens Setup Guide

## Generated Assets

All app icons and splash screens have been generated with a modern gradient blue design featuring a location pin with shopping bag icon and the "Flowdux" branding.

### Icon Files (in `/public/`)

| File | Size | Purpose |
|------|------|---------|
| `favicon.png` | 32x32 | Browser favicon |
| `apple-touch-icon.png` | 180x180 | iOS home screen icon |
| `icon-192.png` | 192x192 | Android/PWA standard icon |
| `icon-512.png` | 512x512 | Android/PWA high-res icon |
| `icon-1024.png` | 1024x1024 | App Store submission & PWA |
| `splash-1920.png` | 1920x1920 | Splash screen for native apps |

## PWA Configuration

The Progressive Web App is configured in `vite.config.ts` with:
- All icon sizes registered in the manifest
- Theme color: `#2563eb` (brand blue)
- Background color: `#2563eb` (matches splash)
- Display mode: `standalone` (full-screen app experience)

## Native App (Capacitor) Configuration

### Current Setup (`capacitor.config.ts`)

```typescript
plugins: {
  SplashScreen: {
    launchShowDuration: 2000,
    launchAutoHide: true,
    backgroundColor: "#2563eb",
    showSpinner: true,
    spinnerColor: "#ffffff"
  },
  StatusBar: {
    style: 'DARK',
    backgroundColor: '#2563eb'
  }
}
```

### For Android Native App

After running `npx cap add android`, you'll need to:

1. **App Icon**: Copy `icon-1024.png` or use Android Asset Studio
   - Navigate to: `android/app/src/main/res/`
   - Create mipmap folders: `mipmap-hdpi`, `mipmap-mdpi`, `mipmap-xhdpi`, `mipmap-xxhdpi`, `mipmap-xxxhdpi`
   - Generate appropriately sized icons for each density
   - Or use Android Studio: Right-click `res` → New → Image Asset

2. **Adaptive Icon** (Android 8.0+):
   - Create `mipmap-anydpi-v26` folder
   - Add `ic_launcher.xml` and `ic_launcher_round.xml` with adaptive icon configuration

3. **Splash Screen**: 
   - The splash screen is configured via Capacitor's plugin
   - Custom splash: Place `splash.png` in `android/app/src/main/res/drawable/`

### For iOS Native App

After running `npx cap add ios`, you'll need to:

1. **App Icon**: Open Xcode project
   - Navigate to: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
   - Use the `icon-1024.png` in Xcode's Asset Catalog
   - Xcode will automatically generate all required sizes

2. **Launch Screen**:
   - Edit `ios/App/App/Base.lproj/LaunchScreen.storyboard` in Xcode
   - Or use the configured splash screen settings in Capacitor

## Updating Icons

To update icons in the future:

1. Generate new icon at 1024x1024px
2. Use online tools like:
   - [RealFaviconGenerator](https://realfavicongenerator.net/)
   - [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
   - [Capacitor Assets](https://github.com/ionic-team/capacitor-assets)

3. Or regenerate using AI:
   ```bash
   # Use the image generation tool to create new variants
   ```

## Build Checklist

Before building for production:

- [ ] All icon files exist in `/public/`
- [ ] `vite.config.ts` manifest references correct icons
- [ ] `index.html` has favicon and apple-touch-icon links
- [ ] `capacitor.config.ts` splash screen configured
- [ ] For Android: Native icons generated in `android/app/src/main/res/`
- [ ] For iOS: AppIcon.appiconset configured in Xcode

## Testing

### PWA (Web):
- Open app in browser
- Check favicon appears in browser tab
- Install as PWA and verify home screen icon

### Android:
- Build APK/AAB
- Install on device
- Check app drawer icon
- Verify splash screen on launch

### iOS:
- Build with Xcode
- Install on device/simulator
- Check home screen icon
- Verify launch screen

## References

- [PWA Icons Guidelines](https://web.dev/add-manifest/#icons)
- [Android App Icons](https://developer.android.com/guide/practices/ui_guidelines/icon_design_launcher)
- [iOS App Icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Capacitor Icons Guide](https://capacitorjs.com/docs/guides/splash-screens-and-icons)
