import React, { useState } from 'react';
import { format } from 'date-fns';
import { Receipt, Pencil, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useLanguage } from '@/lib/LanguageContext';

export default function ExpenseEntryCard({ entry, onDelete, onEdit, onRequestDeletion, isAdmin }) {
  const [deletionReason, setDeletionReason] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { t } = useLanguage();

  const dateStr = entry.date?.split('T')[0] || entry.date;
  const [year, month, day] = (dateStr || '').split('-').map(Number);
  const parsedDate = year ? new Date(year, month - 1, day) : new Date();

  const handleRequestDeletion = () => {
    onRequestDeletion(entry.id, deletionReason);
    setDeletionReason('');
    setDialogOpen(false);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4 flex items-start justify-between shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg mt-0.5 flex-shrink-0">
          <Receipt className="w-4 h-4 text-amber-600 dark:text-amber-500" />
        </div>
        <div>
          <p className="font-semibold text-foreground leading-tight">{entry.description}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <p className="text-xs text-muted-foreground">{format(parsedDate, 'EEE, MMM d')}</p>
            {entry.status === 'pending' && (
              <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500 px-2 py-0.5 rounded-full font-medium">{t('expenseCard.pending')}</span>
            )}
            {entry.status === 'declined' && (
              <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-500 px-2 py-0.5 rounded-full font-medium">{t('expenseCard.declined')}</span>
            )}
            {entry.deletion_requested && (
              <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-500 px-2 py-0.5 rounded-full font-medium">{t('expenseCard.deletionRequested')}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="font-bold text-amber-700 dark:text-amber-500 text-base">₪{Math.round(entry.amount || 0)}</span>

        {/* Edit — only if not deletion_requested */}
        {!entry.deletion_requested && (
          <button onClick={() => onEdit(entry)} className="flex items-center justify-center w-11 h-11 rounded-full text-muted-foreground hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-colors">
            <Pencil className="w-4 h-4" />
          </button>
        )}

        {/* Delete (admin) or Request Deletion (user) */}
        {isAdmin ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="flex items-center justify-center w-11 h-11 rounded-full text-muted-foreground hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('expenseCard.deleteTitle')}</AlertDialogTitle>
                <AlertDialogDescription>{t('expenseCard.deleteDesc')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('expenseCard.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(entry.id)} className="bg-red-500 hover:bg-red-600">{t('expenseCard.delete')}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : !entry.deletion_requested ? (
          <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <AlertDialogTrigger asChild>
              <button className="flex items-center justify-center w-11 h-11 rounded-full text-muted-foreground hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('expenseCard.requestDeletionTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('expenseCard.requestDeletionDesc')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Textarea
                placeholder={t('expenseCard.deletionReasonPlaceholder')}
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                rows={3}
                className="mx-6 mb-2 text-sm"
              />
              <AlertDialogFooter>
                <AlertDialogCancel>{t('expenseCard.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRequestDeletion}
                  disabled={!deletionReason.trim()}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {t('expenseCard.submitRequest')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
      </div>
    </div>
  );
}
