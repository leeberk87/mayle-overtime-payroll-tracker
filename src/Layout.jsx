import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Home, Settings, ClipboardCheck } from 'lucide-react';
import NotificationBell from '@/components/notifications/NotificationBell';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top notification bar */}
      <div className="fixed top-0 right-0 z-20 p-2">
        {user && <NotificationBell userEmail={user.email} />}
      </div>

      {children}
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 safe-area-inset-bottom">
        <div className="max-w-lg mx-auto px-4">
          <div className={`flex items-center ${isAdmin ? 'justify-around' : 'justify-center'} py-2`}>
            <Link 
              to={createPageUrl('Home')}
              className={`flex flex-col items-center py-2 px-6 rounded-xl transition-colors ${
                currentPageName === 'Home' 
                  ? 'text-slate-900 bg-slate-100' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-xs mt-1 font-medium">Home</span>
            </Link>
            
            {isAdmin && (
              <Link 
                to={createPageUrl('ApprovalDashboard')}
                className={`flex flex-col items-center py-2 px-6 rounded-xl transition-colors ${
                  currentPageName === 'ApprovalDashboard' 
                    ? 'text-slate-900 bg-slate-100' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <ClipboardCheck className="w-5 h-5" />
                <span className="text-xs mt-1 font-medium">Approvals</span>
              </Link>
            )}

            {isAdmin && (
              <Link 
                to={createPageUrl('Settings')}
                className={`flex flex-col items-center py-2 px-6 rounded-xl transition-colors ${
                  currentPageName === 'Settings' 
                    ? 'text-slate-900 bg-slate-100' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span className="text-xs mt-1 font-medium">Settings</span>
              </Link>
            )}
          </div>
        </div>
      </nav>
      
      {/* Bottom padding to account for nav */}
      <div className="h-20" />
    </div>
  );
}