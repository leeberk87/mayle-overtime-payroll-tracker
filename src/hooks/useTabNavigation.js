import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const TAB_ROOTS = {
  Home: '/',
  ApprovalDashboard: '/ApprovalDashboard',
  Settings: '/Settings',
};

function getTabForPath(path) {
  if (path.startsWith('/Approval')) return 'ApprovalDashboard';
  if (
    path.startsWith('/Settings') ||
    path.startsWith('/Salary') ||
    path.startsWith('/Notification') ||
    path.startsWith('/UserManagement')
  ) return 'Settings';
  return 'Home';
}

export default function useTabNavigation() {
  const location = useLocation();
  const navigate = useNavigate();

  // Derived from the URL — survives page refresh without any extra storage
  const activeTab = getTabForPath(location.pathname);

  // Switch to a tab — always replace so tapping tabs never adds to the browser back stack
  const navigateToTab = useCallback((tab) => {
    navigate(TAB_ROOTS[tab], { replace: true });
  }, [navigate]);

  // Tapping the already-active tab resets it to its root
  const resetTab = useCallback((tab) => {
    navigate(TAB_ROOTS[tab], { replace: true });
  }, [navigate]);

  // AppHeader back button — uses browser history so it stays in sync with iOS swipe-back gesture.
  // Falls back to a provided path (or the tab root) when there's no history to pop.
  const goBack = useCallback((fallbackPath) => {
    const canGoBack = (window.history.state?.idx ?? 0) > 0;
    if (canGoBack) {
      navigate(-1);
    } else {
      navigate(fallbackPath || TAB_ROOTS[getTabForPath(location.pathname)], { replace: true });
    }
  }, [navigate, location.pathname]);

  return { activeTab, navigateToTab, goBack, resetTab };
}
