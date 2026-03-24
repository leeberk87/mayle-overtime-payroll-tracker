import React, { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Trash2, FileText, Pencil } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function OvertimeEntryCard({ entry, onDelete, onEdit, onRequestDeletion, isAdmin }) {
  const [deletionReason, setDeletionReason] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const duration = entry.duration_minutes || 0;
  const hours = Math.floor(duration / 60);
  const mins = duration % 60;
  const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  const handleRequestDeletion = () => {
    onRequestDeletion(entry.id, deletionReason);
    setDeletionReason('');
    setDialogOpen(false);
  };

  return (
    <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-sm font-medium text-foreground">
                {(() => {
                  const [y, m, d] = (entry.date?.split('T')[0] || entry.date || '').split('-').map(Number);
                  return y ? format(new Date(y, m - 1, d), 'EEE, MMM d') : '';
                })()}
              </span>
              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                {entry.start_time} – {entry.end_time}
              </span>
              {entry.status === 'pending' && (
                <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500 px-2 py-0.5 rounded-full font-medium">Pending</span>
              )}
              {entry.status === 'declined' && (
                <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-500 px-2 py-0.5 rounded-full font-medium">Declined</span>
              )}
              {entry.deletion_requested && (
                <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-500 px-2 py-0.5 rounded-full font-medium">Deletion Requested</span>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{durationStr}</span>
              </div>
              <div className="text-emerald-600 dark:text-emerald-500 font-semibold">
                +₪{entry.ot_pay?.toLocaleString()}
              </div>
            </div>

            {entry.notes && (
              <div className="mt-2 flex items-start gap-1.5 text-muted-foreground text-xs">
                <FileText className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-2">{entry.notes}</span>
              </div>
            )}
          </div>

          <div className="flex gap-1">
            {/* Edit — only if not deletion_requested */}
            {!entry.deletion_requested && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(entry)}
                className="text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            )}

            {/* Delete (admin) or Request Deletion (user) */}
            {isAdmin ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="flex items-center justify-center w-11 h-11 rounded-full text-muted-foreground hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors -mr-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Entry</AlertDialogTitle>
                    <AlertDialogDescription>Are you sure you want to delete this overtime entry? This cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(entry.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : !entry.deletion_requested ? (
              <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <AlertDialogTrigger asChild>
                  <button className="flex items-center justify-center w-11 h-11 rounded-full text-muted-foreground hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors -mr-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Request Deletion</AlertDialogTitle>
                    <AlertDialogDescription>
                      Please provide a reason for deleting this entry. Your request will be reviewed by the admin.
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
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Submit Request
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}