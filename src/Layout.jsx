import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Home, Settings, ClipboardCheck, Plus } from 'lucide-react';
import NotificationBell from '@/components/notifications/NotificationBell';
import useTabNavigation from '@/hooks/useTabNavigation';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const { activeTab, navigateToTab, resetTab } = useTabNavigation();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isAdmin = user?.role === 'admin';



  const navLinkClass = (tab) =>
    `flex flex-col items-center justify-center rounded-xl transition-colors ${
      activeTab === tab
        ? 'text-slate-900 bg-slate-100'
        : 'text-slate-400 hover:text-slate-600'
    }`;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Notification Bell - fixed top right on all screens */}
      <div className="fixed top-2 right-2 z-20">
        {user && <NotificationBell userEmail={user.email} />}
      </div>

      {/* Desktop Sidebar - visible on lg+ screens only */}
      <nav className="hidden lg:flex fixed left-0 top-0 bottom-0 w-16 bg-white border-r border-slate-100 flex-col items-center pt-4 pb-6 gap-1 z-20">
        <button onClick={() => { activeTab === 'Home' ? resetTab('Home') : navigateToTab('Home'); }} className={`${navLinkClass('Home')} w-12 h-12`}>
          <Home className="w-5 h-5" />
          <span className="text-[9px] mt-0.5 font-medium">Home</span>
        </button>

        {isAdmin && (
          <button onClick={() => { activeTab === 'ApprovalDashboard' ? resetTab('ApprovalDashboard') : navigateToTab('ApprovalDashboard'); }} className={`${navLinkClass('ApprovalDashboard')} w-12 h-12`}>
            <ClipboardCheck className="w-5 h-5" />
            <span className="text-[9px] mt-0.5 font-medium">Approvals</span>
          </button>
        )}

        {isAdmin && (
          <button onClick={() => { activeTab === 'Settings' ? resetTab('Settings') : navigateToTab('Settings'); }} className={`${navLinkClass('Settings')} w-12 h-12`}>
            <Settings className="w-5 h-5" />
            <span className="text-[9px] mt-0.5 font-medium">Settings</span>
          </button>
        )}

        <div className="mt-auto">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-add-entry-menu'))}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
          >
            <Plus className="w-5 h-5" />
            <span className="text-[9px] mt-0.5 font-medium">Add</span>
          </button>
        </div>
      </nav>

      {/* Main content area — shifts right on desktop to account for sidebar */}
      <div className="lg:pl-16">
        {children}
      </div>

      {/* Bottom Navigation - mobile only */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 safe-bottom">
        <div className="max-w-lg mx-auto px-3">
          <div className="flex items-center justify-between py-1.5">
            <button
              onClick={() => { activeTab === 'Home' ? resetTab('Home') : navigateToTab('Home'); }}
              className={`${navLinkClass('Home')} py-1.5 px-4`}
            >
              <Home className="w-4 h-4" />
              <span className="text-[10px] mt-0.5 font-medium">Home</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => { activeTab === 'ApprovalDashboard' ? resetTab('ApprovalDashboard') : navigateToTab('ApprovalDashboard'); }}
                className={`${navLinkClass('ApprovalDashboard')} py-1.5 px-4`}
              >
                <ClipboardCheck className="w-4 h-4" />
                <span className="text-[10px] mt-0.5 font-medium">Approvals</span>
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => { activeTab === 'Settings' ? resetTab('Settings') : navigateToTab('Settings'); }}
                className={`${navLinkClass('Settings')} py-1.5 px-4`}
              >
                <Settings className="w-4 h-4" />
                <span className="text-[10px] mt-0.5 font-medium">Settings</span>
              </button>
            )}

            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-add-entry-menu'))}
              className="flex flex-col items-center justify-center py-1.5 px-4 rounded-xl transition-colors text-slate-400 active:text-slate-600"
            >
              <Plus className="w-4 h-4" />
              <span className="text-[10px] mt-0.5 font-medium">Add Entry</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Bottom padding for mobile nav — removed on desktop */}
      <div className="h-16 lg:h-0 safe-bottom" />
    </div>
  );
}