import React from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

export default function MonthSelector({ currentMonth, onChange }) {
  const handlePrev = () => {
    onChange(subMonths(currentMonth, 1));
  };
  
  const handleNext = () => {
    onChange(addMonths(currentMonth, 1));
  };
  
  const isCurrentMonth = format(currentMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM');
  
  return (
    <div className="flex items-center justify-between bg-white rounded-xl p-1 shadow-sm border border-slate-100">
      <button
        onClick={handlePrev}
        className="flex items-center justify-center w-11 h-11 rounded-xl text-slate-600 active:bg-slate-100 transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-slate-400" />
        <span className="font-semibold text-slate-900">
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        {isCurrentMonth && (
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
            Current
          </span>
        )}
      </div>
      
      <button
        onClick={handleNext}
        disabled={isCurrentMonth}
        className="flex items-center justify-center w-11 h-11 rounded-xl text-slate-600 active:bg-slate-100 transition-colors disabled:opacity-30"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}