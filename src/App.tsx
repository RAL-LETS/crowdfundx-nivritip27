import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TopNavBar from './components/TopNavBar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import ExplorePage from './pages/ExplorePage';
import LaunchPage from './pages/LaunchPage';
import DashboardPage from './pages/DashboardPage';
import TerminalPage from './pages/TerminalPage';
import { WalletProvider } from './contexts/WalletContext';
import { ToastProvider } from './contexts/ToastContext';
import Toast from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { captureError } from './lib/monitoring';
import startEventSubscription from './services/event-stream';

// Initialize TanStack Query Client with production-quality settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,           // data is fresh for 30s
      gcTime: 5 * 60_000,          // keep in cache for 5 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10_000),
    },
    mutations: {
      onError: (error: unknown) => {
        captureError(error, { source: 'react-query-mutation' });
      },
    },
  },
});

// Offline banner — shown when network is unavailable
const OfflineBanner = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-16 left-0 w-full z-[90] flex items-center justify-center gap-2 bg-[#1a0a00] border-b border-orange-900 py-2 px-4 font-mono-data text-label-md text-orange-400"
    >
      <span className="material-symbols-outlined text-[16px]">wifi_off</span>
      You are offline. Data may be stale.
    </div>
  );
};

// Common Layout wrapping all routes
const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <TopNavBar />
      <OfflineBanner />
      <div className="flex-grow">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
};

// Component wrapper to register our real-time event streams
const AppContent = () => {
  useEffect(() => {
    const unsubscribe = startEventSubscription(queryClient);
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ErrorBoundary><LandingPage /></ErrorBoundary>} />
          <Route path="explore" element={<ErrorBoundary><ExplorePage /></ErrorBoundary>} />
          <Route path="launch" element={<ErrorBoundary><LaunchPage /></ErrorBoundary>} />
          <Route path="dashboard" element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />
          <Route path="terminal" element={<ErrorBoundary><TerminalPage /></ErrorBoundary>} />
        </Route>
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <ToastProvider>
          <AppContent />
          <Toast />
        </ToastProvider>
      </WalletProvider>
    </QueryClientProvider>
  );
}

export default App;
