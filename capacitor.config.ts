import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.871c9a98d02144e9a2e6d670157771eb',
  appName: 'Flowdux',
  webDir: 'dist',
  server: {
    url: 'https://871c9a98-d021-44e9-a2e6-d670157771eb.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
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
    },
    Keyboard: {
      resize: 'body',
      style: 'dark'
    }
  }
};

export default config;
