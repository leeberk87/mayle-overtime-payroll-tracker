import { useRef, useEffect, useCallback } from 'react';
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
  const stacks = useRef({
    Home: ['/'],
    ApprovalDashboard: ['/ApprovalDashboard'],
    Settings: ['/Settings'],
  });

  const activeTab = getTabForPath(location.pathname);

  // Keep current tab's stack in sync with the actual path
  useEffect(() => {
    const path = location.pathname;
    const tab = getTabForPath(path);
    const stack = stacks.current[tab];

    // Only push if this path is different from the top of the stack
    if (stack[stack.length - 1] !== path) {
      stack.push(path);
    }
  }, [location.pathname]);

  const navigateToTab = useCallback((tab) => {
    const stack = stacks.current[tab];
    const dest = stack[stack.length - 1] || TAB_ROOTS[tab];
    if (dest !== location.pathname) {
      navigate(dest);
    }
  }, [navigate, location.pathname]);

  const goBack = useCallback((fallbackPath) => {
    const tab = getTabForPath(location.pathname);
    const stack = stacks.current[tab];

    // Pop current page
    if (stack.length > 1) {
      stack.pop();
      const prev = stack[stack.length - 1];
      navigate(prev);
    } else if (fallbackPath) {
      navigate(fallbackPath);
    } else {
      navigate(TAB_ROOTS[tab]);
    }
  }, [navigate, location.pathname]);

  // Reset a tab's stack when navigating to its root via the tab bar
  const resetTab = useCallback((tab) => {
    const root = TAB_ROOTS[tab];
    stacks.current[tab] = [root];
    navigate(root);
  }, [navigate]);

  return { activeTab, navigateToTab, goBack, resetTab, stacks };
}