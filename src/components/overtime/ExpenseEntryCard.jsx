import React from 'react';
import { format } from 'date-fns';
import { Receipt, Pencil, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const CATEGORY_LABELS = {
  food: 'Food & Drinks',
  activities: 'Activities & Entry Fees',
  transport: 'Transport',
  other: 'Other',
};

export default function ExpenseEntryCard({ entry, onDelete, onEdit }) {
  return (
    <div className="bg-white rounded-xl border border-amber-100 p-4 flex items-start justify-between shadow-sm">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-50 rounded-lg mt-0.5">
          <Receipt className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <p className="font-semibold text-slate-800">{entry.description}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {format(new Date(entry.date), 'EEE, MMM d')} · {CATEGORY_LABELS[entry.category] || 'Other'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="font-bold text-amber-700 text-base">₪{entry.amount?.toFixed(2)}</span>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={() => onEdit(entry)}>
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
              <AlertDialogDescription>This will permanently remove this expense entry.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(entry.id)} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}