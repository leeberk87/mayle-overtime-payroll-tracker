import React from 'react';
import { Clock, Receipt } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';

export default function AddEntryMenu({ onSelectOvertme, onSelectExpense, onClose }) {
  return (
    <BottomSheet open={true} onOpenChange={(v) => { if (!v) onClose(); }} title="What would you like to add?">
      <div className="space-y-2 pb-2">
        <button
          onClick={onSelectOvertme}
          className="w-full flex items-center gap-4 min-h-[56px] p-4 rounded-xl border border-slate-200 active:bg-slate-50 transition-colors text-left"
        >
          <div className="p-2.5 bg-slate-100 rounded-lg">
            <Clock className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">Extra Work Hours</p>
            <p className="text-sm text-slate-500">Log overtime hours worked</p>
          </div>
        </button>

        <button
          onClick={onSelectExpense}
          className="w-full flex items-center gap-4 min-h-[56px] p-4 rounded-xl border border-slate-200 active:bg-slate-50 transition-colors text-left"
        >
          <div className="p-2.5 bg-amber-100 rounded-lg">
            <Receipt className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">Expense Reimbursement</p>
            <p className="text-sm text-slate-500">Log money spent on the kids</p>
          </div>
        </button>
      </div>
    </BottomSheet>
  );
}