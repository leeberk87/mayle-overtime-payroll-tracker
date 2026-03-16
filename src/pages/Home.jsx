import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";

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
  const [currentMonth, setCurrentMonth] = useState(new Date());
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

  const isEmployer = user?.role === 'admin';
  const isNanny = user?.role === 'user';

  const queryClient = useQueryClient();

  const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

  const { data: settingsList = [] } = useQuery({
    queryKey: ['settings'],
    queryFn: () => base44.entities.AppSettings.list('-effective_date'),
  });

  const settings = settingsList.find(s =>
    s.effective_date && s.effective_date <= monthEnd
  ) || settingsList[settingsList.length - 1] || null;

  const { data: overtimeSessions = [] } = useQuery({
    queryKey: ['overtime-sessions', monthStart, monthEnd],
    queryFn: () => base44.entities.OvertimeRequest.filter({ status: 'approved' }, '-date'),
    enabled: isEmployer,
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', monthStart, monthEnd],
    queryFn: () => base44.entities.ExpenseRequest.filter({ status: 'approved' }, '-date'),
    enabled: isEmployer,
  });

  const { data: myOTRequests = [] } = useQuery({
    queryKey: ['my-ot-requests'],
    queryFn: () => base44.entities.OvertimeRequest.filter({ created_by: user?.email }, '-created_date'),
    enabled: isNanny && !!user,
  });

  const { data: myExpenseRequests = [] } = useQuery({
    queryKey: ['my-expense-requests'],
    queryFn: () => base44.entities.ExpenseRequest.filter({ created_by: user?.email }, '-created_date'),
    enabled: isNanny && !!user,
  });

  const monthOT = overtimeSessions.filter(s => s.date >= monthStart && s.date <= monthEnd);
  const monthExpenses = expenses.filter(e => e.date >= monthStart && e.date <= monthEnd);
  const monthMyOT = myOTRequests.filter(r => r.date >= monthStart && r.date <= monthEnd);
  const monthMyExpenses = myExpenseRequests.filter(r => r.date >= monthStart && r.date <= monthEnd);

  const totalOtPay = monthOT.reduce((sum, s) => sum + (s.ot_pay || 0), 0);
  const totalOtHours = monthOT.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / 60;
  const totalExpenses = monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const createOTMutation = useMutation({
    mutationFn: (data) => base44.entities.OvertimeRequest.create({ ...data, status: 'approved' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['overtime-sessions'] }); toast.success('Overtime entry saved!'); setShowOTForm(false); },
  });

  const updateOTMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.OvertimeRequest.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['overtime-sessions'] }); toast.success('Overtime entry updated!'); setShowOTForm(false); setEditingOT(null); },
  });

  const deleteOTMutation = useMutation({
    mutationFn: (id) => base44.entities.OvertimeRequest.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['overtime-sessions'] }); toast.success('Entry deleted.'); },
  });

  const createExpenseMutation = useMutation({
    mutationFn: (data) => base44.entities.ExpenseRequest.create({ ...data, status: 'approved' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['expenses'] }); toast.success('Expense saved!'); setShowExpenseForm(false); },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ExpenseRequest.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['expenses'] }); toast.success('Expense updated!'); setShowExpenseForm(false); setEditingExpense(null); },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id) => base44.entities.ExpenseRequest.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['expenses'] }); toast.success('Expense deleted.'); },
  });

  const submitOTRequestMutation = useMutation({
    mutationFn: (data) => base44.entities.OvertimeRequest.create({ ...data, submitted_by_name: user?.full_name }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-ot-requests'] }); toast.success('Overtime request submitted!'); setShowRequestOTForm(false); },
  });

  const submitExpenseRequestMutation = useMutation({
    mutationFn: (data) => base44.entities.ExpenseRequest.create({ ...data, submitted_by_name: user?.full_name }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-expense-requests'] }); toast.success('Expense request submitted!'); setShowRequestExpenseForm(false); },
  });

  const handleOTSubmit = (data) => {
    if (editingOT) updateOTMutation.mutate(data);
    else createOTMutation.mutate(data);
  };

  const handleExpenseSubmit = (data) => {
    if (editingExpense) updateExpenseMutation.mutate(data);
    else createExpenseMutation.mutate(data);
  };

  const handleEditOT = (entry) => { setEditingOT(entry); setShowOTForm(true); };
  const handleEditExpense = (entry) => { setEditingExpense(entry); setShowExpenseForm(true); };

  if (!user) return null;

  const employeeLabel = settings?.employee_role_label || 'Nanny';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {isEmployer ? `${employeeLabel} Tracker` : 'My Work Log'}
              </h1>
              <p className="text-xs text-slate-500">
                {isEmployer ? `Manage ${employeeLabel.toLowerCase()} hours & expenses` : 'Your hours and expenses'}
              </p>
            </div>
            {isEmployer && (
              <Button onClick={() => setShowAddMenu(true)} className="bg-slate-800 hover:bg-slate-900 rounded-xl gap-2">
                <Plus className="w-4 h-4" /> Add
              </Button>
            )}
            {isNanny && (
              <Button onClick={() => setShowAddMenu(true)} className="bg-slate-800 hover:bg-slate-900 rounded-xl gap-2">
                <Plus className="w-4 h-4" /> Request
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <MonthSelector currentMonth={currentMonth} onChange={setCurrentMonth} />

        {isEmployer && (
          <>
            <SalarySummaryCard settings={settings} totalOtPay={totalOtPay} totalOtHours={totalOtHours} totalExpenses={totalExpenses} />

            {monthOT.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">Overtime Sessions</h2>
                <div className="space-y-3">
                  {monthOT.map(entry => (
                    <OvertimeEntryCard key={entry.id} entry={entry} onDelete={deleteOTMutation.mutate} onEdit={handleEditOT} />
                  ))}
                </div>
              </div>
            )}

            {monthExpenses.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">Expenses</h2>
                <div className="space-y-3">
                  {monthExpenses.map(entry => (
                    <ExpenseEntryCard key={entry.id} entry={entry} onDelete={deleteExpenseMutation.mutate} onEdit={handleEditExpense} />
                  ))}
                </div>
              </div>
            )}

            {monthOT.length === 0 && monthExpenses.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-100 p-10 text-center">
                <p className="text-slate-400 text-sm">No entries for this month.</p>
              </div>
            )}
          </>
        )}

        {isNanny && (
          <>
            {monthMyOT.length === 0 && monthMyExpenses.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-100 p-10 text-center">
                <p className="text-slate-400 text-sm">No requests submitted this month.</p>
                <p className="text-slate-400 text-xs mt-1">Tap "Request" to submit hours or expenses.</p>
              </div>
            )}

            {monthMyOT.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">My Overtime Requests</h2>
                <div className="space-y-3">
                  {monthMyOT.map(req => (
                    <RequestCard key={req.id} request={req} type="overtime" />
                  ))}
                </div>
              </div>
            )}

            {monthMyExpenses.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">My Expense Requests</h2>
                <div className="space-y-3">
                  {monthMyExpenses.map(req => (
                    <RequestCard key={req.id} request={req} type="expense" />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showAddMenu && (
        <AddEntryMenu
          onClose={() => setShowAddMenu(false)}
          onSelectOvertme={() => { setShowAddMenu(false); isEmployer ? setShowOTForm(true) : setShowRequestOTForm(true); }}
          onSelectExpense={() => { setShowAddMenu(false); isEmployer ? setShowExpenseForm(true) : setShowRequestExpenseForm(true); }}
        />
      )}

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

      {isNanny && (
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
            onSubmit={submitExpenseRequestMutation.mutate}
            isLoading={submitExpenseRequestMutation.isPending}
          />
        </>
      )}
    </div>
  );
}