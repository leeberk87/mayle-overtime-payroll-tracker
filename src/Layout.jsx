import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Settings } from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {children}
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 safe-area-inset-bottom">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex items-center justify-around py-2">
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
          </div>
        </div>
      </nav>
      
      {/* Bottom padding to account for nav */}
      <div className="h-20" />
    </div>
  );
}