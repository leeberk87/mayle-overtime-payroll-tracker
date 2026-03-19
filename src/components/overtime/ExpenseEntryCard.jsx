import React from 'react';
import { format } from 'date-fns';
import { Receipt, Pencil, Trash2 } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function ExpenseEntryCard({ entry, onDelete, onEdit }) {
  // Parse date safely avoiding timezone offset issues
  const dateStr = entry.date?.split('T')[0] || entry.date;
  const [year, month, day] = (dateStr || '').split('-').map(Number);
  const parsedDate = year ? new Date(year, month - 1, day) : new Date();

  return (
    <div className="bg-white rounded-xl border border-amber-100 p-4 flex items-start justify-between shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-50 rounded-lg mt-0.5 flex-shrink-0">
          <Receipt className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <p className="font-semibold text-slate-800 leading-tight">{entry.description}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-slate-400">{format(parsedDate, 'EEE, MMM d')}</p>
            {entry.status === 'pending' && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Pending</span>
            )}
            {entry.status === 'declined' && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Declined</span>
            )}
          </div>
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