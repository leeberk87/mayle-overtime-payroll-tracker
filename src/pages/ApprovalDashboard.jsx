import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock, Receipt, CheckCircle, XCircle, Trash2 } from "lucide-react";
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
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">{item.submitted_by}</p>
            <p className="text-xs text-slate-500 mt-0.5">{dateStr}</p>
          </div>
          <div className="text-right">
            {entityType === 'OvertimeSession' ? (
              <>
                <p className="text-sm font-bold text-emerald-600">+₪{item.ot_pay || 0}</p>
                <p className="text-xs text-slate-500">
                  {Math.floor((item.duration_minutes || 0) / 60)}h {(item.duration_minutes || 0) % 60}m
                </p>
              </>
            ) : (
              <p className="text-sm font-bold text-amber-600">₪{item.amount || 0}</p>
            )}
          </div>
        </div>
        {item.notes && <p className="text-xs text-slate-500 mt-2 italic">"{item.notes}"</p>}
        {item.description && <p className="text-xs text-slate-600 mt-2">{item.description}</p>}
        {entityType === 'OvertimeSession' && item.start_time && (
          <p className="text-xs text-slate-400 mt-1">{item.start_time} – {item.end_time}</p>
        )}
      </div>

      <div className="px-4 pb-4 flex gap-2">
        <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => onApprove(item.id, item.submitted_by, item.date)} disabled={isProcessing}>
          <CheckCircle className="w-4 h-4 mr-1" /> Approve
        </Button>
        <Button size="sm" variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
          onClick={() => setShowDeclineInput(v => !v)} disabled={isProcessing}>
          <XCircle className="w-4 h-4 mr-1" /> Decline
        </Button>
      </div>

      {showDeclineInput && (
        <div className="px-4 pb-4 space-y-2 border-t border-slate-50 pt-3">
          <Textarea placeholder="Reason for declining (optional)" value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)} rows={2} className="text-sm" />
          <Button size="sm" variant="destructive" className="w-full" onClick={handleDecline} disabled={isProcessing}>
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
    <div className="bg-white rounded-xl border border-orange-200 shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">{item.submitted_by}</p>
            <p className="text-xs text-slate-500 mt-0.5">{dateStr}</p>
          </div>
          <div className="text-right">
            {entityType === 'OvertimeSession' ? (
              <>
                <p className="text-sm font-bold text-emerald-600">+₪{item.ot_pay || 0}</p>
                <p className="text-xs text-slate-500">
                  {Math.floor((item.duration_minutes || 0) / 60)}h {(item.duration_minutes || 0) % 60}m
                </p>
              </>
            ) : (
              <p className="text-sm font-bold text-amber-600">₪{item.amount || 0}</p>
            )}
          </div>
        </div>
        {item.notes && <p className="text-xs text-slate-500 mt-2 italic">"{item.notes}"</p>}
        {item.description && <p className="text-xs text-slate-600 mt-2">{item.description}</p>}
        {item.deletion_reason && (
          <div className="mt-2 bg-orange-50 rounded-lg px-3 py-2">
            <p className="text-xs text-orange-700 font-medium">Reason: {item.deletion_reason}</p>
          </div>
        )}
      </div>

      <div className="px-4 pb-4 flex gap-2">
        <Button size="sm" className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          onClick={() => onConfirmDelete(item.id)} disabled={isProcessing}>
          <Trash2 className="w-4 h-4 mr-1" /> Confirm Delete
        </Button>
        <Button size="sm" variant="outline" className="flex-1"
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['pending-expenses'] });
      toast.success('Entry approved!');
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['pending-expenses'] });
      toast.success('Entry declined.');
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
  });

  const isProcessing = approveMutation.isPending || declineMutation.isPending || confirmDeleteMutation.isPending || rejectDeletionMutation.isPending;

  if (authLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Skeleton className="h-32 w-32 rounded-xl" /></div>;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const totalPending = pendingSessions.length + pendingExpenses.length;
  const totalDeletionRequests = deletionSessionRequests.length + deletionExpenseRequests.length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="text-slate-600">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Approval Dashboard</h1>
              <p className="text-xs text-slate-500">{totalPending} pending · {totalDeletionRequests} deletion {totalDeletionRequests === 1 ? 'request' : 'requests'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
        {/* Pending Overtime */}
        <div>
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4" /> Overtime Entries ({pendingSessions.length})
          </h2>
          {sessionsLoading ? (
            <div className="space-y-3"><Skeleton className="h-24 w-full rounded-xl" /><Skeleton className="h-24 w-full rounded-xl" /></div>
          ) : pendingSessions.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-100 p-6 text-center text-slate-400 text-sm">No pending overtime entries</div>
          ) : (
            <div className="space-y-3">
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
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
            <Receipt className="w-4 h-4" /> Expense Entries ({pendingExpenses.length})
          </h2>
          {expensesLoading ? (
            <div className="space-y-3"><Skeleton className="h-24 w-full rounded-xl" /></div>
          ) : pendingExpenses.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-100 p-6 text-center text-slate-400 text-sm">No pending expense entries</div>
          ) : (
            <div className="space-y-3">
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
            <div className="space-y-3">
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