import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// App version for cache busting - update this on each deployment
const APP_VERSION = __FLOWDUX_BUILD_ID__;
const VERSION_KEY = 'flowdux_app_version';

// Function to clear all caches
async function clearAllCaches(): Promise<void> {
  try {
    // Clear Cache Storage
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('[Cache] Cleared all caches:', cacheNames);
    }
  } catch (error) {
    console.error('[Cache] Failed to clear caches:', error);
  }
}

// Function to unregister all service workers
async function unregisterServiceWorkers(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
      if (registrations.length > 0) {
        console.log('[SW] Unregistered', registrations.length, 'service worker(s)');
      }
    } catch (error) {
      console.error('[SW] Failed to unregister service workers:', error);
    }
  }
}

// Check for version mismatch and clear caches if needed
async function checkVersionAndClearCache(): Promise<boolean> {
  try {
    const storedVersion = localStorage.getItem(VERSION_KEY);
    
    if (storedVersion !== APP_VERSION) {
      console.log('[Version] Detected version change:', storedVersion, '->', APP_VERSION);
      
      // Clear all caches and service workers
      await unregisterServiceWorkers();
      await clearAllCaches();
      
      // Update stored version
      localStorage.setItem(VERSION_KEY, APP_VERSION);
      
      // Return true to indicate a reload might be needed
      return true;
    }
    return false;
  } catch (error) {
    console.error('[Version] Check failed:', error);
    return false;
  }
}

// Loading timeout detection
function setupLoadingTimeout(): void {
  const TIMEOUT_MS = 15000; // 15 seconds
  
  const timeoutId = setTimeout(() => {
    const rootElement = document.getElementById('root');
    
    // Check if the app has actually rendered content
    if (rootElement && (!rootElement.hasChildNodes() || rootElement.innerHTML.trim() === '')) {
      console.error('[Timeout] App failed to render within', TIMEOUT_MS, 'ms');
      
      // Show recovery UI
      showRecoveryUI(rootElement);
    }
  }, TIMEOUT_MS);
  
  // Clear timeout when app loads successfully
  window.addEventListener('load', () => {
    // Give React a moment to hydrate
    setTimeout(() => {
      const rootElement = document.getElementById('root');
      if (rootElement && rootElement.hasChildNodes() && rootElement.innerHTML.trim() !== '') {
        clearTimeout(timeoutId);
        console.log('[App] Loaded successfully');
      }
    }, 1000);
  });
}

// Show recovery UI when app fails to load
function showRecoveryUI(container: HTMLElement): void {
  container.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
      font-family: system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #f8f9fe 0%, #e8e9f3 100%);
      text-align: center;
    ">
      <div style="
        background: white;
        padding: 32px;
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        max-width: 400px;
      ">
        <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
        <h1 style="margin: 0 0 12px; font-size: 20px; color: #1a1a2e;">
          Loading Issue Detected
        </h1>
        <p style="margin: 0 0 24px; color: #666; font-size: 14px; line-height: 1.5;">
          The app is taking longer than expected to load. This might be due to cached data.
        </p>
        <button 
          onclick="(async function(){
            try {
              if('caches' in window) {
                const names = await caches.keys();
                await Promise.all(names.map(n => caches.delete(n)));
              }
              if('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                await Promise.all(regs.map(r => r.unregister()));
              }
              localStorage.clear();
              sessionStorage.clear();
              window.location.reload();
            } catch(e) {
              window.location.reload();
            }
          })()"
          style="
            background: #6C5CE7;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            margin-bottom: 12px;
          "
        >
          Clear Cache & Reload
        </button>
        <button 
          onclick="window.location.reload()"
          style="
            background: transparent;
            color: #6C5CE7;
            border: 1px solid #6C5CE7;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
          "
        >
          Try Simple Reload
        </button>
      </div>
    </div>
  `;
}

// Main initialization
async function initializeApp(): Promise<void> {
  try {
    // Check version and clear cache if needed
    const versionChanged = await checkVersionAndClearCache();
    
    if (versionChanged) {
      console.log('[Init] Version changed, clearing and continuing...');
      // Don't reload, just continue with fresh state
    }
    
    // Setup loading timeout detection
    setupLoadingTimeout();
    
    // Force unregister all service workers (aggressive cleanup)
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
          console.log('[SW] Force unregistered service worker');
        }
      } catch (e) {
        console.warn('[SW] Could not unregister service workers:', e);
      }
    }
    
    // Get root element
    const rootElement = document.getElementById("root");
    
    if (!rootElement) {
      console.error('[Init] Root element not found!');
      document.body.innerHTML = `
        <div style="padding: 20px; text-align: center;">
          <h1>Failed to initialize app</h1>
          <p>Root element not found. Please refresh the page.</p>
          <button onclick="window.location.reload()" style="padding: 10px 20px;">Refresh</button>
        </div>
      `;
      return;
    }
    
    // Render the app
    console.log('[Init] Rendering app...');
    createRoot(rootElement).render(<App />);
    console.log('[Init] App rendered successfully');
    
    // Signal to HTML that app loaded (for recovery panel)
    if (typeof (window as any).markAppLoaded === 'function') {
      (window as any).markAppLoaded();
    }
    
  } catch (error) {
    console.error('[Init] Failed to initialize app:', error);
    
    // Show error UI
    const rootElement = document.getElementById("root");
    if (rootElement) {
      showRecoveryUI(rootElement);
    }
  }
}

// Start the app
initializeApp();
