import { useCallback, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const TAB_ROOTS = {
  Home: '/',
  ApprovalDashboard: '/ApprovalDashboard',
  Settings: '/Settings',
};

function getTabForPath(path) {
  if (path.startsWith('/Approval')) return 'ApprovalDashboard';
  if (path.startsWith('/Settings')) return 'Settings';
  return 'Home';
}

// Persist last-visited path per tab so switching back returns to the right place
const STORAGE_KEY = 'tab-history';

function loadTabHistory() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveTabHistory(history) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch { /* noop */ }
}

export default function useTabNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const tabHistoryRef = useRef(loadTabHistory());

  // Derived from the URL — survives page refresh
  const activeTab = getTabForPath(location.pathname);

  // Keep the stored path up-to-date whenever the user navigates within a tab
  useEffect(() => {
    tabHistoryRef.current[activeTab] = location.pathname;
    saveTabHistory(tabHistoryRef.current);
  }, [activeTab, location.pathname]);

  // Switch to a different tab — restore its last-visited path (or root)
  const navigateToTab = useCallback((tab) => {
    const targetPath = tabHistoryRef.current[tab] || TAB_ROOTS[tab];
    navigate(targetPath, { replace: true });
  }, [navigate]);

  // Tapping the already-active tab resets it to its root
  const resetTab = useCallback((tab) => {
    tabHistoryRef.current[tab] = TAB_ROOTS[tab];
    saveTabHistory(tabHistoryRef.current);
    navigate(TAB_ROOTS[tab], { replace: true });
  }, [navigate]);

  // Back button — uses browser history so it stays in sync with iOS swipe-back gesture.
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
