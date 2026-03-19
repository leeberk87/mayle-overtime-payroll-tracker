import React from 'react';
import { Clock, Receipt } from 'lucide-react';

export default function AddEntryMenu({ onSelectOvertme, onSelectExpense, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-2xl w-full max-w-lg mx-4 p-6 pb-8 space-y-3 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">What would you like to add?</p>

        <button
          onClick={onSelectOvertme}
          className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-left"
        >
          <div className="p-2 bg-slate-100 rounded-lg">
            <Clock className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">Extra Work Hours</p>
            <p className="text-sm text-slate-500">Log overtime hours worked</p>
          </div>
        </button>

        <button
          onClick={onSelectExpense}
          className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-left"
        >
          <div className="p-2 bg-amber-100 rounded-lg">
            <Receipt className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">Expense Reimbursement</p>
            <p className="text-sm text-slate-500">Log money spent on the kids</p>
          </div>
        </button>
      </div>
    </div>
  );
}