import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function AppHeader({ title, subtitle, backPath, rightContent }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="bg-white border-b border-slate-100 sticky top-0 z-10 safe-top">
      <div className="max-w-lg lg:max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 min-w-0">
          {backPath !== undefined && (
            <button
              onClick={handleBack}
              className="flex items-center justify-center w-11 h-11 -ml-2 rounded-full text-slate-600 active:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-900 truncate leading-tight">{title}</h1>
            {subtitle && <p className="text-[11px] text-slate-500 leading-tight">{subtitle}</p>}
          </div>
        </div>
        {rightContent && <div className="flex-shrink-0">{rightContent}</div>}
      </div>
    </div>
  );
}