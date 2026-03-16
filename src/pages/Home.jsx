import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import MonthSelector from '@/components/overtime/MonthSelector';
import SalarySummaryCard from '@/components/overtime/SalarySummaryCard';
import OvertimeEntryCard from '@/components/overtime/OvertimeEntryCard';
import ExpenseEntryCard from '@/components/overtime/ExpenseEntryCard';
import OvertimeForm from '@/components/overtime/OvertimeForm';
import ExpenseForm from '@/components/overtime/ExpenseForm';
import AddEntryMenu from '@/components/overtime/AddEntryMenu';
import RequestOvertimeForm from '@/components/overtime/RequestOvertimeForm';
import RequestExpenseForm from '@/components/overtime/RequestExpenseForm';
import RequestCard from '@/components/overtime/RequestCard';

export default function Home() {
  const [user, setUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showOTForm, setShowOTForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showRequestOTForm, setShowRequestOTForm] = useState(false);
  const [showRequestExpenseForm, setShowRequestExpenseForm] = useState(false);
  const [editingOT, setEditingOT] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isEmployer = user?.role === 'employer';

  const monthStart = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(selectedDate), 'yyyy-MM-dd');

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => base44.entities.AppSettings.list('-effective_date', 1).then(r => r[0]),
  });

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['overtime-sessions', monthStart],
    queryFn: () => base44.entities.OvertimeSession.filter({ date: { $gte: monthStart, $lte: monthEnd } }, 'date'),
    enabled: isEmployer,
  });

  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses', monthStart],
    queryFn: () => base44.entities.Expense.filter({ date: { $gte: monthStart, $lte: monthEnd } }, 'date'),
    enabled: isEmployer,
  });

  const { data: myOTRequests = [], isLoading: myOTLoading } = useQuery({
    queryKey: ['my-ot-requests', monthStart],
    queryFn: () => base44.entities.OvertimeRequest.filter({ date: { $gte: monthStart, $lte: monthEnd } }, '-created_date'),
    enabled: !isEmployer && user !== null,
  });

  const { data: myExpRequests = [], isLoading: myExpLoading } = useQuery({
    queryKey: ['my-exp-requests', monthStart],
    queryFn: () => base44.entities.ExpenseRequest.filter({ date: { $gte: monthStart, $lte: monthEnd } }, '-created_date'),
    enabled: !isEmployer && user !== null,
  });

  const queryClient = useQueryClient();

  // Employer mutations
  const createOTMutation = useMutation({
    mutationFn: (data) => base44.entities.OvertimeSession.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['overtime-sessions'] }); setShowOTForm(false); toast.success('Entry saved!'); },
  });

  const updateOTMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.OvertimeSession.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['overtime-sessions'] }); setShowOTForm(false); setEditingOT(null); toast.success('Entry updated!'); },
  });

  const deleteOTMutation = useMutation({
    mutationFn: (id) => base44.entities.OvertimeSession.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['overtime-sessions'] }); toast.success('Entry deleted.'); },
  });

  const createExpenseMutation = useMutation({
    mutationFn: (data) => base44.entities.Expense.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['expenses'] }); setShowExpenseForm(false); toast.success('Expense saved!'); },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Expense.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['expenses'] }); setShowExpenseForm(false); setEditingExpense(null); toast.success('Expense updated!'); },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id) => base44.entities.Expense.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['expenses'] }); toast.success('Expense deleted.'); },
  });

  // Nanny mutations
  const submitOTRequestMutation = useMutation({
    mutationFn: (data) => base44.entities.OvertimeRequest.create({ ...data, submitted_by_name: user?.full_name }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-ot-requests'] }); setShowRequestOTForm(false); toast.success('Request submitted!'); },
  });

  const submitExpRequestMutation = useMutation({
    mutationFn: (data) => base44.entities.ExpenseRequest.create({ ...data, submitted_by_name: user?.full_name }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-exp-requests'] }); setShowRequestExpenseForm(false); toast.success('Request submitted!'); },
  });

  const totalOtPay = sessions.reduce((sum, s) => sum + (s.ot_pay || 0), 0);
  const totalOtMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
  const totalOtHours = totalOtMinutes / 60;
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const isLoading = isEmployer ? (sessionsLoading || expensesLoading) : (myOTLoading || myExpLoading);

  const handleOTSubmit = (data) => {
    if (editingOT) updateOTMutation.mutate({ id: editingOT.id, data });
    else createOTMutation.mutate(data);
  };

  const handleExpenseSubmit = (data) => {
    if (editingExpense) updateExpenseMutation.mutate({ id: editingExpense.id, data });
    else createExpenseMutation.mutate(data);
  };

  const employeeLabel = settings?.employee_role_label || 'Nanny';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {isEmployer ? `${employeeLabel} Hours` : 'My Submissions'}
            </h1>
            <p className="text-xs text-slate-500">{user?.full_name}</p>
          </div>
          <Button
            onClick={() => setShowAddMenu(true)}
            className="bg-slate-800 hover:bg-slate-900 rounded-full w-10 h-10 p-0"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <MonthSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />

        {isEmployer && (
          <SalarySummaryCard
            settings={settings}
            totalOtPay={totalOtPay}
            totalOtHours={totalOtHours}
            totalExpenses={totalExpenses}
          />
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        ) : isEmployer ? (
          <>
            {sessions.length === 0 && expenses.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-100 p-10 text-center text-slate-400">
                <p className="font-medium">No entries this month</p>
                <p className="text-sm mt-1">Tap + to add overtime or an expense.</p>
              </div>
            )}
            {sessions.map(s => (
              <OvertimeEntryCard
                key={s.id}
                entry={s}
                onEdit={(e) => { setEditingOT(e); setShowOTForm(true); }}
                onDelete={(id) => deleteOTMutation.mutate(id)}
              />
            ))}
            {expenses.map(e => (
              <ExpenseEntryCard
                key={e.id}
                entry={e}
                onEdit={(ex) => { setEditingExpense(ex); setShowExpenseForm(true); }}
                onDelete={(id) => deleteExpenseMutation.mutate(id)}
              />
            ))}
          </>
        ) : (
          <>
            {myOTRequests.length === 0 && myExpRequests.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-100 p-10 text-center text-slate-400">
                <p className="font-medium">No submissions this month</p>
                <p className="text-sm mt-1">Tap + to submit a request.</p>
              </div>
            )}
            {myOTRequests.map(r => <RequestCard key={r.id} request={r} type="overtime" />)}
            {myExpRequests.map(r => <RequestCard key={r.id} request={r} type="expense" />)}
          </>
        )}
      </div>

      {/* Modals */}
      <AddEntryMenu
        open={showAddMenu}
        onClose={() => setShowAddMenu(false)}
        onSelectOvertime={() => { setShowAddMenu(false); isEmployer ? setShowOTForm(true) : setShowRequestOTForm(true); }}
        onSelectExpense={() => { setShowAddMenu(false); isEmployer ? setShowExpenseForm(true) : setShowRequestExpenseForm(true); }}
      />

      {isEmployer && (
        <>
          <OvertimeForm
            open={showOTForm}
            onOpenChange={(v) => { setShowOTForm(v); if (!v) setEditingOT(null); }}
            onSubmit={handleOTSubmit}
            settings={settings}
            isLoading={createOTMutation.isPending || updateOTMutation.isPending}
            editingEntry={editingOT}
          />
          <ExpenseForm
            open={showExpenseForm}
            onOpenChange={(v) => { setShowExpenseForm(v); if (!v) setEditingExpense(null); }}
            onSubmit={handleExpenseSubmit}
            isLoading={createExpenseMutation.isPending || updateExpenseMutation.isPending}
            editingEntry={editingExpense}
          />
        </>
      )}

      {!isEmployer && (
        <>
          <RequestOvertimeForm
            open={showRequestOTForm}
            onOpenChange={setShowRequestOTForm}
            onSubmit={submitOTRequestMutation.mutate}
            settings={settings}
            isLoading={submitOTRequestMutation.isPending}
          />
          <RequestExpenseForm
            open={showRequestExpenseForm}
            onOpenChange={setShowRequestExpenseForm}
            onSubmit={submitExpRequestMutation.mutate}
            isLoading={submitExpRequestMutation.isPending}
          />
        </>
      )}
    </div>
  );
}