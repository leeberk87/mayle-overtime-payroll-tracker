import React from 'react';
import { format, addMonths, subMonths } from 'date-fns';
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
    <div className="flex items-center justify-between bg-card rounded-xl p-1 shadow-sm border border-border">
      <button
        onClick={handlePrev}
        className="flex items-center justify-center w-11 h-11 rounded-xl text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <span className="font-semibold text-foreground">
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        {isCurrentMonth && (
          <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-500 px-2 py-0.5 rounded-full">
            Current
          </span>
        )}
      </div>
      
      <button
        onClick={handleNext}
        disabled={isCurrentMonth}
        className="flex items-center justify-center w-11 h-11 rounded-xl text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-30"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}