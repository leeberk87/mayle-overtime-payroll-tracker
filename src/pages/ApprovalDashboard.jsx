import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Receipt, CheckCircle, XCircle, Trash2 } from "lucide-react";
import AppHeader from '@/components/AppHeader';
import { format } from 'date-fns';
import { toast } from 'sonner';

function ReviewCard({ item, entityType, onApprove, onDecline, isProcessing }) {
  const [reviewNotes, setReviewNotes] = useState('');
  const [showDeclineInput, setShowDeclineInput] = useState(false);

  const dateStr = item.date ? format(new Date(item.date + 'T00:00:00'), 'MMM d, yyyy') : '—';

  const handleDecline = () => {
    onDecline(item.id, item.submitted_by, item.date, reviewNotes);
    setShowDeclineInput(false);
    setReviewNotes('');
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">{item.submitted_by}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{dateStr}</p>
          </div>
          <div className="text-right">
            {entityType === 'OvertimeSession' ? (
              <>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-500">+₪{item.ot_pay || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {Math.floor((item.duration_minutes || 0) / 60)}h {(item.duration_minutes || 0) % 60}m
                </p>
              </>
            ) : (
              <p className="text-sm font-bold text-amber-600 dark:text-amber-500">₪{item.amount || 0}</p>
            )}
          </div>
        </div>
        {item.notes && <p className="text-xs text-muted-foreground mt-2 italic">"{item.notes}"</p>}
        {item.description && <p className="text-xs text-muted-foreground mt-2">{item.description}</p>}
        {entityType === 'OvertimeSession' && item.start_time && (
          <p className="text-xs text-muted-foreground mt-1">{item.start_time} – {item.end_time}</p>
        )}
      </div>

      <div className="px-4 pb-4 flex gap-2">
        <Button className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800 text-white"
          onClick={() => onApprove(item.id, item.submitted_by, item.date)} disabled={isProcessing}>
          <CheckCircle className="w-4 h-4 mr-1" /> Approve
        </Button>
        <Button variant="outline" className="flex-1 h-12 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
          onClick={() => setShowDeclineInput(v => !v)} disabled={isProcessing}>
          <XCircle className="w-4 h-4 mr-1" /> Decline
        </Button>
      </div>

      {showDeclineInput && (
        <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
          <Textarea placeholder="Reason for declining (optional)" value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)} rows={2} className="text-sm" />
          <Button variant="destructive" className="w-full h-12" onClick={handleDecline} disabled={isProcessing}>
            Confirm Decline
          </Button>
        </div>
      )}
    </div>
  );
}

function DeletionRequestCard({ item, entityType, onConfirmDelete, onRejectDeletion, isProcessing }) {
  const dateStr = item.date ? format(new Date(item.date + 'T00:00:00'), 'MMM d, yyyy') : '—';

  return (
    <div className="bg-card rounded-xl border border-orange-200 dark:border-orange-900/50 shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">{item.submitted_by}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{dateStr}</p>
          </div>
          <div className="text-right">
            {entityType === 'OvertimeSession' ? (
              <>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-500">+₪{item.ot_pay || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {Math.floor((item.duration_minutes || 0) / 60)}h {(item.duration_minutes || 0) % 60}m
                </p>
              </>
            ) : (
              <p className="text-sm font-bold text-amber-600 dark:text-amber-500">₪{item.amount || 0}</p>
            )}
          </div>
        </div>
        {item.notes && <p className="text-xs text-muted-foreground mt-2 italic">"{item.notes}"</p>}
        {item.description && <p className="text-xs text-muted-foreground mt-2">{item.description}</p>}
        {item.deletion_reason && (
          <div className="mt-2 bg-orange-50 dark:bg-orange-950/30 rounded-lg px-3 py-2">
            <p className="text-xs text-orange-700 dark:text-orange-500 font-medium">Reason: {item.deletion_reason}</p>
          </div>
        )}
      </div>

      <div className="px-4 pb-4 flex gap-2">
        <Button className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white"
          onClick={() => onConfirmDelete(item.id)} disabled={isProcessing}>
          <Trash2 className="w-4 h-4 mr-1" /> Confirm Delete
        </Button>
        <Button variant="outline" className="flex-1 h-12"
          onClick={() => onRejectDeletion(item.id)} disabled={isProcessing}>
          <XCircle className="w-4 h-4 mr-1" /> Keep Entry
        </Button>
      </div>
    </div>
  );
}

export default function ApprovalDashboard() {
  const [user, setUser] = React.useState(null);
  const [authLoading, setAuthLoading] = React.useState(true);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {}).finally(() => setAuthLoading(false));
  }, []);

  const { data: pendingSessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['pending-sessions'],
    queryFn: () => base44.entities.OvertimeSession.filter({ status: 'pending' }, '-date'),
    enabled: user?.role === 'admin',
  });

  const { data: pendingExpenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['pending-expenses'],
    queryFn: () => base44.entities.Expense.filter({ status: 'pending' }, '-date'),
    enabled: user?.role === 'admin',
  });

  const { data: deletionSessionRequests = [] } = useQuery({
    queryKey: ['deletion-sessions'],
    queryFn: () => base44.entities.OvertimeSession.filter({ deletion_requested: true }, '-date'),
    enabled: user?.role === 'admin',
  });

  const { data: deletionExpenseRequests = [] } = useQuery({
    queryKey: ['deletion-expenses'],
    queryFn: () => base44.entities.Expense.filter({ deletion_requested: true }, '-date'),
    enabled: user?.role === 'admin',
  });

  const approveMutation = useMutation({
    mutationFn: async ({ entityType, id, submitted_by, entry_date }) => {
      if (entityType === 'OvertimeSession') {
        await base44.entities.OvertimeSession.update(id, { status: 'approved' });
      } else {
        await base44.entities.Expense.update(id, { status: 'approved' });
      }
      await base44.functions.invoke('notifyOnStatusChange', {
        submitted_by, status: 'approved', entity_type: entityType, entity_id: id, entry_date,
      });
    },
    onMutate: async ({ entityType, id }) => {
      const qk = entityType === 'OvertimeSession' ? ['pending-sessions'] : ['pending-expenses'];
      await queryClient.cancelQueries({ queryKey: qk });
      const prev = queryClient.getQueryData(qk);
      queryClient.setQueryData(qk, (old = []) => old.filter(i => i.id !== id));
      return { prev, qk };
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(ctx.qk, ctx.prev);
      toast.error('Failed to approve entry. Please try again.');
    },
    onSuccess: () => toast.success('Entry approved!'),
    onSettled: (_, __, { entityType }) => {
      queryClient.invalidateQueries({ queryKey: entityType === 'OvertimeSession' ? ['pending-sessions'] : ['pending-expenses'] });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async ({ entityType, id, submitted_by, entry_date, review_notes }) => {
      if (entityType === 'OvertimeSession') {
        await base44.entities.OvertimeSession.update(id, { status: 'declined', review_notes });
      } else {
        await base44.entities.Expense.update(id, { status: 'declined', review_notes });
      }
      await base44.functions.invoke('notifyOnStatusChange', {
        submitted_by, status: 'declined', entity_type: entityType, entity_id: id, entry_date, review_notes,
      });
    },
    onMutate: async ({ entityType, id }) => {
      const qk = entityType === 'OvertimeSession' ? ['pending-sessions'] : ['pending-expenses'];
      await queryClient.cancelQueries({ queryKey: qk });
      const prev = queryClient.getQueryData(qk);
      queryClient.setQueryData(qk, (old = []) => old.filter(i => i.id !== id));
      return { prev, qk };
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(ctx.qk, ctx.prev);
      toast.error('Failed to decline entry. Please try again.');
    },
    onSuccess: () => toast.success('Entry declined.'),
    onSettled: (_, __, { entityType }) => {
      queryClient.invalidateQueries({ queryKey: entityType === 'OvertimeSession' ? ['pending-sessions'] : ['pending-expenses'] });
    },
  });

  const confirmDeleteMutation = useMutation({
    mutationFn: async ({ entityType, id }) => {
      if (entityType === 'OvertimeSession') {
        await base44.entities.OvertimeSession.delete(id);
      } else {
        await base44.entities.Expense.delete(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deletion-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['deletion-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['overtime-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Entry deleted.');
    },
    onError: () => toast.error('Failed to delete entry. Please try again.'),
  });

  const rejectDeletionMutation = useMutation({
    mutationFn: async ({ entityType, id }) => {
      if (entityType === 'OvertimeSession') {
        await base44.entities.OvertimeSession.update(id, { deletion_requested: false, deletion_reason: null });
      } else {
        await base44.entities.Expense.update(id, { deletion_requested: false, deletion_reason: null });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deletion-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['deletion-expenses'] });
      toast.success('Deletion request rejected — entry kept.');
    },
    onError: () => toast.error('Something went wrong. Please try again.'),
  });

  const isProcessing = approveMutation.isPending || declineMutation.isPending || confirmDeleteMutation.isPending || rejectDeletionMutation.isPending;

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Skeleton className="h-32 w-32 rounded-xl" /></div>;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const totalPending = pendingSessions.length + pendingExpenses.length;
  const totalDeletionRequests = deletionSessionRequests.length + deletionExpenseRequests.length;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title="Approval Dashboard"
        subtitle={`${totalPending} pending · ${totalDeletionRequests} deletion ${totalDeletionRequests === 1 ? 'request' : 'requests'}`}
        backPath="/"
      />

      <div className="max-w-lg lg:max-w-5xl mx-auto px-4 py-6 space-y-8">
        {/* Pending Overtime */}
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4" /> Overtime Entries ({pendingSessions.length})
          </h2>
          {sessionsLoading ? (
            <div className="space-y-3"><Skeleton className="h-24 w-full rounded-xl" /><Skeleton className="h-24 w-full rounded-xl" /></div>
          ) : pendingSessions.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-6 text-center text-muted-foreground text-sm">No pending overtime entries</div>
          ) : (
            <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
              {pendingSessions.map(item => (
                <ReviewCard key={item.id} item={item} entityType="OvertimeSession" isProcessing={isProcessing}
                  onApprove={(id, submitted_by, entry_date) => approveMutation.mutate({ entityType: 'OvertimeSession', id, submitted_by, entry_date })}
                  onDecline={(id, submitted_by, entry_date, review_notes) => declineMutation.mutate({ entityType: 'OvertimeSession', id, submitted_by, entry_date, review_notes })}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pending Expenses */}
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
            <Receipt className="w-4 h-4" /> Expense Entries ({pendingExpenses.length})
          </h2>
          {expensesLoading ? (
            <div className="space-y-3"><Skeleton className="h-24 w-full rounded-xl" /></div>
          ) : pendingExpenses.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-6 text-center text-muted-foreground text-sm">No pending expense entries</div>
          ) : (
            <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
              {pendingExpenses.map(item => (
                <ReviewCard key={item.id} item={item} entityType="Expense" isProcessing={isProcessing}
                  onApprove={(id, submitted_by, entry_date) => approveMutation.mutate({ entityType: 'Expense', id, submitted_by, entry_date })}
                  onDecline={(id, submitted_by, entry_date, review_notes) => declineMutation.mutate({ entityType: 'Expense', id, submitted_by, entry_date, review_notes })}
                />
              ))}
            </div>
          )}
        </div>

        {/* Deletion Requests */}
        {(totalDeletionRequests > 0) && (
          <div>
            <h2 className="text-sm font-semibold text-orange-700 flex items-center gap-2 mb-3">
              <Trash2 className="w-4 h-4" /> Deletion Requests ({totalDeletionRequests})
            </h2>
            <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
              {deletionSessionRequests.map(item => (
                <DeletionRequestCard key={item.id} item={item} entityType="OvertimeSession" isProcessing={isProcessing}
                  onConfirmDelete={(id) => confirmDeleteMutation.mutate({ entityType: 'OvertimeSession', id })}
                  onRejectDeletion={(id) => rejectDeletionMutation.mutate({ entityType: 'OvertimeSession', id })}
                />
              ))}
              {deletionExpenseRequests.map(item => (
                <DeletionRequestCard key={item.id} item={item} entityType="Expense" isProcessing={isProcessing}
                  onConfirmDelete={(id) => confirmDeleteMutation.mutate({ entityType: 'Expense', id })}
                  onRejectDeletion={(id) => rejectDeletionMutation.mutate({ entityType: 'Expense', id })}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}