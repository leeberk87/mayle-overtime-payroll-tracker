import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Home, Settings, ClipboardCheck, Plus } from 'lucide-react';
import NotificationBell from '@/components/notifications/NotificationBell';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-50">
      {children}
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 safe-area-inset-bottom">
        <div className="max-w-lg mx-auto px-3">
          <div className="flex items-center justify-between py-1.5">
            <Link 
              to={createPageUrl('Home')}
              className={`flex flex-col items-center py-1.5 px-4 rounded-lg transition-colors ${
                currentPageName === 'Home' 
                  ? 'text-slate-900 bg-slate-100' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="text-[10px] mt-0.5 font-medium">Home</span>
            </Link>

            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-add-entry-menu'))}
              className="flex flex-col items-center py-1.5 px-4 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
            >
              <Plus className="w-4 h-4" />
              <span className="text-[10px] mt-0.5 font-medium">Add Entry</span>
            </button>
            
            {isAdmin && (
              <Link 
                to={createPageUrl('ApprovalDashboard')}
                className={`flex flex-col items-center py-1.5 px-4 rounded-lg transition-colors ${
                  currentPageName === 'ApprovalDashboard' 
                    ? 'text-slate-900 bg-slate-100' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <ClipboardCheck className="w-4 h-4" />
                <span className="text-[10px] mt-0.5 font-medium">Approvals</span>
              </Link>
            )}

            {isAdmin && (
              <Link 
                to={createPageUrl('Settings')}
                className={`flex flex-col items-center py-1.5 px-4 rounded-lg transition-colors ${
                  currentPageName === 'Settings' 
                    ? 'text-slate-900 bg-slate-100' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span className="text-[10px] mt-0.5 font-medium">Settings</span>
              </Link>
            )}

            {user && (
              <div className="flex flex-col items-center py-1.5 px-2 rounded-lg">
                <NotificationBell userEmail={user.email} />
              </div>
            )}
          </div>
        </div>
      </nav>
      
      {/* Bottom padding to account for nav */}
      <div className="h-16" />
    </div>
  );
}