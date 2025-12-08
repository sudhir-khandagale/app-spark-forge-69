import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { BackButtonHandler } from "@/components/BackButtonHandler";
import { NetworkStatus } from "@/components/NetworkStatus";
import { AppInitializer } from "@/components/AppInitializer";
import { OnboardingCheck } from "@/components/OnboardingCheck";
import { HelmetProvider } from 'react-helmet-async';

// Lazy load non-critical components
const InstallBanner = lazy(() => import("@/components/InstallBanner"));
const WebVitalsReporter = lazy(() => import("@/components/WebVitalsReporter").then(m => ({ default: m.WebVitalsReporter })));

// Eager load only the home page for fastest FCP
import Index from "./pages/Index";

// Lazy load Auth and Search - not needed on initial load
const Auth = lazy(() => import("./pages/Auth"));
const Search = lazy(() => import("./pages/Search"));

// Lazy load non-critical routes with prefetch hints
const MapView = lazy(() => import("./pages/MapView"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const StoreProfile = lazy(() => import("./pages/StoreProfile"));
const Scanner = lazy(() => import("./pages/Scanner"));
const Profile = lazy(() => import("./pages/Profile"));
const Lists = lazy(() => import("./pages/Lists"));
const ListDetails = lazy(() => import("./pages/ListDetails"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Settings = lazy(() => import("./pages/Settings"));
const Reserve = lazy(() => import("./pages/Reserve"));
const NotFound = lazy(() => import("./pages/NotFound"));
const MerchantOnboarding = lazy(() => import("./pages/MerchantOnboarding"));
const StoreDashboardRedirect = lazy(() => import("./components/StoreDashboardRedirect"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminSetup = lazy(() => import("./pages/AdminSetup"));
const Cart = lazy(() => import("./pages/Cart"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Compare = lazy(() => import("./pages/Compare"));
const Achievements = lazy(() => import("./pages/Achievements"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const ProfileManagement = lazy(() => import("./pages/ProfileManagement"));
const Install = lazy(() => import("./pages/Install"));
const Friends = lazy(() => import("./pages/Friends"));
const ProfileOnboarding = lazy(() => import("./pages/ProfileOnboarding"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderHistory = lazy(() => import("./pages/OrderHistory"));
const VendorFeed = lazy(() => import("./pages/VendorFeed"));
const LiveInventory = lazy(() => import("./pages/LiveInventory"));
const VendorDashboard = lazy(() => import("./pages/VendorDashboard"));
const VendorOrders = lazy(() => import("./pages/VendorOrders"));
const VendorEarnings = lazy(() => import("./pages/VendorEarnings"));
const VendorScanQR = lazy(() => import("./pages/VendorScanQR"));

// Lazy load heavy vendor components
const AddProduct = lazy(() => import("./pages/AddProduct"));

// Minimal loading fallback - uses CSS-only animation for performance
const PageLoader = () => (
  <div className="flex flex-col min-h-screen p-4 space-y-4" role="status" aria-label="Loading">
    <div className="h-12 w-full bg-muted/50 animate-pulse rounded-lg" />
    <div className="h-64 w-full bg-muted/50 animate-pulse rounded-lg" />
  </div>
);

// Hook to mark app as loaded
const useMarkLoaded = () => {
  useEffect(() => {
    document.body.classList.add('loaded');
  }, []);
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const AppContent = () => {
  useMarkLoaded();
  
  return (
    <BrowserRouter>
      <OnboardingCheck />
      <BackButtonHandler />
      <NetworkStatus />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/search" element={<Search />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/store/:id" element={<StoreProfile />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile/manage" element={<ProtectedRoute><ProfileManagement /></ProtectedRoute>} />
          <Route path="/lists" element={<ProtectedRoute><Lists /></ProtectedRoute>} />
          <Route path="/lists/:id" element={<ProtectedRoute><ListDetails /></ProtectedRoute>} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/reserve/:id" element={<ProtectedRoute><Reserve /></ProtectedRoute>} />
          <Route path="/onboarding/merchant" element={<ProtectedRoute><MerchantOnboarding /></ProtectedRoute>} />
          <Route path="/dashboard/store/:storeId" element={<StoreDashboardRedirect />} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin-setup" element={<AdminSetup />} />
          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
          <Route path="/compare/:id" element={<Compare />} />
          <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
          <Route path="/profile/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
          <Route path="/profile/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
          <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
          <Route path="/profile/onboarding" element={<ProtectedRoute><ProfileOnboarding /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
          <Route path="/vendor-feed" element={<VendorFeed />} />
          <Route path="/inventory/:storeId" element={<ProtectedRoute><LiveInventory /></ProtectedRoute>} />
          <Route path="/vendor/dashboard" element={<ProtectedRoute><VendorDashboard /></ProtectedRoute>} />
          <Route path="/vendor/dashboard/:storeId" element={<ProtectedRoute><VendorDashboard /></ProtectedRoute>} />
          <Route path="/vendor/orders" element={<ProtectedRoute><VendorOrders /></ProtectedRoute>} />
          <Route path="/vendor/earnings" element={<ProtectedRoute><VendorEarnings /></ProtectedRoute>} />
          <Route path="/vendor/scan-qr" element={<ProtectedRoute><VendorScanQR /></ProtectedRoute>} />
          <Route path="/add-product/:storeId" element={<ProtectedRoute><AddProduct /></ProtectedRoute>} />
          <Route path="/install" element={<Install />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="flowdux-theme">
        <LanguageProvider>
          <TooltipProvider>
            <AppInitializer />
            <Suspense fallback={null}>
              <WebVitalsReporter />
              <InstallBanner />
            </Suspense>
            <Toaster />
            <Sonner />
            <AppContent />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
