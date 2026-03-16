import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock, Receipt, InboxIcon } from "lucide-react";
import { toast } from "sonner";
import ReviewRequestCard from '@/components/overtime/ReviewRequestCard';

export default function Requests() {
  const queryClient = useQueryClient();

  const { data: otRequests = [], isLoading: otLoading } = useQuery({
    queryKey: ['ot-requests', 'pending'],
    queryFn: () => base44.entities.OvertimeRequest.filter({ status: 'pending' }, '-created_date'),
  });

  const { data: expRequests = [], isLoading: expLoading } = useQuery({
    queryKey: ['exp-requests', 'pending'],
    queryFn: () => base44.entities.ExpenseRequest.filter({ status: 'pending' }, '-created_date'),
  });

  const approveOTMutation = useMutation({
    mutationFn: (id) => base44.entities.OvertimeRequest.update(id, { status: 'approved' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ot-requests'] });
      queryClient.invalidateQueries({ queryKey: ['overtime-sessions'] });
      toast.success('Overtime request approved!');
    },
  });

  const declineOTMutation = useMutation({
    mutationFn: ({ id, reason }) => base44.entities.OvertimeRequest.update(id, { status: 'declined', employer_notes: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ot-requests'] });
      toast.success('Overtime request declined.');
    },
  });

  const approveExpMutation = useMutation({
    mutationFn: (id) => base44.entities.ExpenseRequest.update(id, { status: 'approved' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exp-requests'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense request approved!');
    },
  });

  const declineExpMutation = useMutation({
    mutationFn: ({ id, reason }) => base44.entities.ExpenseRequest.update(id, { status: 'declined', employer_notes: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exp-requests'] });
      toast.success('Expense request declined.');
    },
  });

  const isLoading = otLoading || expLoading;
  const totalPending = otRequests.length + expRequests.length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link to="/Home">
              <Button variant="ghost" size="icon" className="text-slate-600">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Pending Requests</h1>
              <p className="text-xs text-slate-500">Review and approve submissions</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
          </div>
        ) : totalPending === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
            <InboxIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">All caught up!</p>
            <p className="text-slate-400 text-sm mt-1">No pending requests to review.</p>
          </div>
        ) : (
          <>
            {otRequests.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4" /> Overtime Requests ({otRequests.length})
                </h2>
                <div className="space-y-3">
                  {otRequests.map(req => (
                    <ReviewRequestCard
                      key={req.id}
                      request={req}
                      type="overtime"
                      onApprove={(id) => approveOTMutation.mutate(id)}
                      onDecline={(id, reason) => declineOTMutation.mutate({ id, reason })}
                    />
                  ))}
                </div>
              </div>
            )}

            {expRequests.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                  <Receipt className="w-4 h-4" /> Expense Requests ({expRequests.length})
                </h2>
                <div className="space-y-3">
                  {expRequests.map(req => (
                    <ReviewRequestCard
                      key={req.id}
                      request={req}
                      type="expense"
                      onApprove={(id) => approveExpMutation.mutate(id)}
                      onDecline={(id, reason) => declineExpMutation.mutate({ id, reason })}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}