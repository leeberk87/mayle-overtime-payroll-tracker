import React, { useState } from 'react';
import { format } from 'date-fns';
import { Receipt, Pencil, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function ExpenseEntryCard({ entry, onDelete, onEdit, onRequestDeletion, isAdmin }) {
  const [deletionReason, setDeletionReason] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const dateStr = entry.date?.split('T')[0] || entry.date;
  const [year, month, day] = (dateStr || '').split('-').map(Number);
  const parsedDate = year ? new Date(year, month - 1, day) : new Date();

  const handleRequestDeletion = () => {
    onRequestDeletion(entry.id, deletionReason);
    setDeletionReason('');
    setDialogOpen(false);
  };

  return (
    <div className="bg-white rounded-xl border border-amber-100 p-4 flex items-start justify-between shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-50 rounded-lg mt-0.5 flex-shrink-0">
          <Receipt className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <p className="font-semibold text-slate-800 leading-tight">{entry.description}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <p className="text-xs text-slate-400">{format(parsedDate, 'EEE, MMM d')}</p>
            {entry.status === 'pending' && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Pending</span>
            )}
            {entry.status === 'declined' && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Declined</span>
            )}
            {entry.deletion_requested && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">Deletion Requested</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="font-bold text-amber-700 text-base">₪{entry.amount?.toFixed(2)}</span>

        {/* Edit — only if not deletion_requested */}
        {!entry.deletion_requested && (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={() => onEdit(entry)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        )}

        {/* Delete (admin) or Request Deletion (user) */}
        {isAdmin ? (
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
        ) : !entry.deletion_requested ? (
          <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Request Deletion</AlertDialogTitle>
                <AlertDialogDescription>
                  Please provide a reason for deleting this expense. Your request will be reviewed by the admin.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Textarea
                placeholder="Reason for deletion (e.g. entered by mistake)"
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                rows={3}
                className="mx-6 mb-2 text-sm"
              />
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRequestDeletion}
                  disabled={!deletionReason.trim()}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Submit Request
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
      </div>
    </div>
  );
}