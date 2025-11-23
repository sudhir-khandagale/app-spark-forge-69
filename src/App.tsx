import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Search from "./pages/Search";
import MapView from "./pages/MapView";
import ProductDetails from "./pages/ProductDetails";
import StoreProfile from "./pages/StoreProfile";
import Scanner from "./pages/Scanner";
import Profile from "./pages/Profile";
import Lists from "./pages/Lists";
import ListDetails from "./pages/ListDetails";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import Reserve from "./pages/Reserve";
import NotFound from "./pages/NotFound";
import MerchantOnboarding from "./pages/MerchantOnboarding";
import StoreDashboard from "./pages/StoreDashboard";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/search" element={<Search />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/store/:id" element={<StoreProfile />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/lists" element={<ProtectedRoute><Lists /></ProtectedRoute>} />
          <Route path="/lists/:id" element={<ProtectedRoute><ListDetails /></ProtectedRoute>} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/reserve/:id" element={<ProtectedRoute><Reserve /></ProtectedRoute>} />
          <Route path="/onboarding/merchant" element={<ProtectedRoute><MerchantOnboarding /></ProtectedRoute>} />
          <Route path="/dashboard/store/:storeId" element={<ProtectedRoute><StoreDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
