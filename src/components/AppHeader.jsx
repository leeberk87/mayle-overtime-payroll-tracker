import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

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
    <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
      <div className="max-w-lg lg:max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {backPath !== undefined && (
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0 text-slate-600"
              onClick={handleBack}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 truncate">{title}</h1>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {rightContent && <div className="flex-shrink-0">{rightContent}</div>}
      </div>
    </div>
  );
}