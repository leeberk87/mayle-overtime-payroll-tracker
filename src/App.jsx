import React, { Suspense, lazy } from 'react'
import { Toaster } from "@/components/ui/toaster"
import { AnimatePresence } from 'framer-motion'
import PageTransition from '@/components/PageTransition'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { ThemeProvider } from "next-themes";

// Lazy-load admin sub-pages — keeps the initial WebView bundle small
const UserManagement = lazy(() => import('./pages/UserManagement'));
const SalarySettings = lazy(() => import('./pages/SalarySettings'));
const NotificationSettings = lazy(() => import('./pages/NotificationSettings'));

const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-muted border-t-foreground/40 rounded-full animate-spin" />
  </div>
);

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();

  React.useEffect(() => {
    if (!isLoadingAuth && !isLoadingPublicSettings && authError?.type === 'auth_required' && window.location.pathname !== '/login') {
      navigateToLogin();
    }
  }, [isLoadingAuth, isLoadingPublicSettings, authError]);

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      return (
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
        </div>
      );
    }
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <LayoutWrapper currentPageName={mainPageKey}>
            <PageTransition><MainPage /></PageTransition>
          </LayoutWrapper>
        } />
        {Object.entries(Pages).map(([path, Page]) => (
          <Route
            key={path}
            path={`/${path}`}
            element={
              <LayoutWrapper currentPageName={path}>
                <PageTransition><Page /></PageTransition>
              </LayoutWrapper>
            }
          />
        ))}
        <Route path="/UserManagement" element={<LayoutWrapper currentPageName="UserManagement"><PageTransition><UserManagement /></PageTransition></LayoutWrapper>} />
        <Route path="/SalarySettings" element={<LayoutWrapper currentPageName="SalarySettings"><PageTransition><SalarySettings /></PageTransition></LayoutWrapper>} />
        <Route path="/NotificationSettings" element={<LayoutWrapper currentPageName="NotificationSettings"><PageTransition><NotificationSettings /></PageTransition></LayoutWrapper>} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
      </AnimatePresence>
    </Suspense>
  );
};


function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Router>
            <NavigationTracker />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </ThemeProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App