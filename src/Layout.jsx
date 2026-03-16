import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Home, Settings, Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isEmployer = user?.role === 'employer';

  const { data: otRequests = [] } = useQuery({
    queryKey: ['ot-requests-mine'],
    queryFn: () => base44.entities.OvertimeRequest.filter({ status: 'pending' }, '-created_date'),
    enabled: isEmployer,
  });

  const { data: expRequests = [] } = useQuery({
    queryKey: ['exp-requests-mine'],
    queryFn: () => base44.entities.ExpenseRequest.filter({ status: 'pending' }, '-created_date'),
    enabled: isEmployer,
  });

  const pendingCount = isEmployer
    ? (otRequests.length + expRequests.length)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {children}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 safe-area-inset-bottom">
        <div className="max-w-lg mx-auto px-4">
          <div className={`flex items-center ${isEmployer ? 'justify-around' : 'justify-center'} py-2`}>
            <Link
              to="/Home"
              className={`flex flex-col items-center py-2 px-6 rounded-xl transition-colors ${
                currentPageName === 'Home'
                  ? 'text-slate-900 bg-slate-100'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-xs mt-1 font-medium">Home</span>
            </Link>

            {isEmployer && (
              <Link
                to="/Requests"
                className={`relative flex flex-col items-center py-2 px-6 rounded-xl transition-colors ${
                  currentPageName === 'Requests'
                    ? 'text-slate-900 bg-slate-100'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Bell className="w-5 h-5" />
                {pendingCount > 0 && (
                  <span className="absolute top-1 right-4 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
                <span className="text-xs mt-1 font-medium">Requests</span>
              </Link>
            )}

            {isEmployer && (
              <Link
                to="/Settings"
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

      <div className="h-20" />
    </div>
  );
}