import React, { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, isBefore, isAfter } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Clock, FileText, Receipt, Bell } from "lucide-react";
import { toast } from "sonner";
import { Link } from 'react-router-dom';

import SalarySummaryCard from '@/components/overtime/SalarySummaryCard';
import OvertimeEntryCard from '@/components/overtime/OvertimeEntryCard';
import OvertimeForm from '@/components/overtime/OvertimeForm';
import MonthSelector from '@/components/overtime/MonthSelector';
import AddEntryMenu from '@/components/overtime/AddEntryMenu';
import ExpenseForm from '@/components/overtime/ExpenseForm';
import ExpenseEntryCard from '@/components/overtime/ExpenseEntryCard';
import RequestOvertimeForm from '@/components/overtime/RequestOvertimeForm';
import RequestExpenseForm from '@/components/overtime/RequestExpenseForm';
import RequestCard from '@/components/overtime/RequestCard';

export default function Home() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [requestOTOpen, setRequestOTOpen] = useState(false);
  const [requestExpOpen, setRequestExpOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isEmployer = user?.role === 'employer';
  const isNanny = user?.role === 'nanny';

  // Fetch all settings versions for historical lookup
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => base44.entities.AppSettings.list('-effective_date'),
  });

  // Find the settings effective for the selected month
  const settings = useMemo(() => {
    if (!settingsData?.length) return { base_salary: 10000, transport_allowance: 250, overtime_rate: 65, employee_role_label: 'Nanny' };
    const monthStart = startOfMonth(selectedMonth);
    // Find the latest settings record with effective_date <= end of selected month
    const applicable = settingsData
      .filter(s => !s.effective_date || !isAfter(parseISO(s.effective_date), monthStart))
      .sort((a, b) => {
        if (!a.effective_date) return 1;
        if (!b.effective_date) return -1;
        return isBefore(parseISO(a.effective_date), parseISO(b.effective_date)) ? 1 : -1;
      });
    return applicable[0] || settingsData[settingsData.length - 1];
  }, [settingsData, selectedMonth]);

  const employeeLabel = settings?.employee_role_label || 'Nanny';

  // Fetch overtime sessions (employer-logged)
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['overtime-sessions'],
    queryFn: () => base44.entities.OvertimeSession.list('-date'),
  });

  // Fetch expenses (employer-logged)
  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list('-date'),
  });

  // Fetch OT requests (nanny view: own; employer view: all pending count)
  const { data: otRequests = [], isLoading: otReqLoading } = useQuery({
    queryKey: ['ot-requests-mine'],
    queryFn: () => base44.entities.OvertimeRequest.list('-created_date'),
    enabled: !!user,
  });

  // Fetch expense requests
  const { data: expRequests = [], isLoading: expReqLoading } = useQuery({
    queryKey: ['exp-requests-mine'],
    queryFn: () => base44.entities.ExpenseRequest.list('-created_date'),
    enabled: !!user,
  });

  const pendingCount = useMemo(() => {
    if (!isEmployer) return 0;
    return otRequests.filter(r => r.status === 'pending').length +
           expRequests.filter(r => r.status === 'pending').length;
  }, [isEmployer, otRequests, expRequests]);

  // Filter by month
  const filteredSessions = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    return sessions.filter(s => {
      const d = new Date(s.date);
      return isWithinInterval(d, { start: monthStart, end: monthEnd });
    });
  }, [sessions, selectedMonth]);

  const filteredExpenses = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    return expenses.filter(e => {
      const d = new Date(e.date);
      return isWithinInterval(d, { start: monthStart, end: monthEnd });
    });
  }, [expenses, selectedMonth]);

  // Nanny: filter their own requests by month
  const filteredOTRequests = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    return otRequests.filter(r => {
      const d = new Date(r.date);
      return isWithinInterval(d, { start: monthStart, end: monthEnd });
    });
  }, [otRequests, selectedMonth]);

  const filteredExpRequests = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    return expRequests.filter(r => {
      const d = new Date(r.date);
      return isWithinInterval(d, { start: monthStart, end: monthEnd });
    });
  }, [expRequests, selectedMonth]);

  const { totalOtPay, totalOtHours } = useMemo(() => {
    const pay = filteredSessions.reduce((sum, s) => sum + (s.ot_pay || 0), 0);
    const minutes = filteredSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    return { totalOtPay: pay, totalOtHours: minutes / 60 };
  }, [filteredSessions]);

  const totalExpenses = useMemo(() =>
    filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0),
  [filteredExpenses]);

  // Employer mutations
  const saveMutation = useMutation({
    mutationFn: (payload) => {
      if (payload.id) return base44.entities.OvertimeSession.update(payload.id, payload.data);
      return base44.entities.OvertimeSession.create(payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['overtime-sessions'] });
      setFormOpen(false);
      setEditingEntry(null);
      toast.success(variables.id ? 'Entry updated!' : 'Overtime entry saved!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.OvertimeSession.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overtime-sessions'] });
      toast.success('Entry deleted');
    },
  });

  const saveExpenseMutation = useMutation({
    mutationFn: (payload) => {
      if (payload.id) return base44.entities.Expense.update(payload.id, payload.data);
      return base44.entities.Expense.create(payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setExpenseFormOpen(false);
      setEditingExpense(null);
      toast.success(variables.id ? 'Expense updated!' : 'Expense saved!');
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id) => base44.entities.Expense.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense deleted');
    },
  });

  // Nanny mutations
  const submitOTRequestMutation = useMutation({
    mutationFn: (data) => base44.entities.OvertimeRequest.create({ ...data, submitted_by_name: user?.full_name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ot-requests-mine'] });
      setRequestOTOpen(false);
      toast.success('Overtime request submitted for approval!');
    },
  });

  const submitExpRequestMutation = useMutation({
    mutationFn: (data) => base44.entities.ExpenseRequest.create({ ...data, submitted_by_name: user?.full_name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exp-requests-mine'] });
      setRequestExpOpen(false);
      toast.success('Expense request submitted for approval!');
    },
  });

  const handleEdit = (entry) => { setEditingEntry(entry); setFormOpen(true); };
  const handleFormClose = (open) => { setFormOpen(open); if (!open) setEditingEntry(null); };
  const handleEditExpense = (expense) => { setEditingExpense(expense); setExpenseFormOpen(true); };

  const isLoading = settingsLoading || sessionsLoading || expensesLoading;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Mayle</h1>
              <p className="text-xs text-slate-500">
                {isEmployer ? 'Employer Dashboard' : `${employeeLabel} Dashboard`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isEmployer && pendingCount > 0 && (
                <Link to="/Requests">
                  <Button variant="outline" className="relative border-amber-200 text-amber-700 hover:bg-amber-50">
                    <Bell className="w-4 h-4 mr-2" />
                    {pendingCount} Pending
                  </Button>
                </Link>
              )}
              <Button onClick={() => setMenuOpen(true)} className="bg-slate-800 hover:bg-slate-900 shadow-lg">
                <Plus className="w-4 h-4 mr-2" />
                {isNanny ? 'Submit' : 'Add Entry'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <MonthSelector currentMonth={selectedMonth} onChange={setSelectedMonth} />

        {/* Salary Summary — employer only */}
        {isEmployer && (
          isLoading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : (
            <SalarySummaryCard
              settings={settings}
              totalOtPay={totalOtPay}
              totalOtHours={totalOtHours}
              totalExpenses={totalExpenses}
            />
          )
        )}

        {/* ---- EMPLOYER VIEW ---- */}
        {isEmployer && (
          <>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Overtime Entries
                </h2>
                <span className="text-xs text-slate-500">{filteredSessions.length} {filteredSessions.length === 1 ? 'entry' : 'entries'}</span>
              </div>
              {isLoading ? (
                <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
              ) : filteredSessions.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-100 p-8 text-center">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No overtime entries this month</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSessions.map(entry => (
                    <OvertimeEntryCard key={entry.id} entry={entry} onDelete={deleteMutation.mutate} onEdit={handleEdit} />
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Receipt className="w-4 h-4" /> Expense Reimbursements
                </h2>
                <span className="text-xs text-slate-500">
                  {filteredExpenses.length} {filteredExpenses.length === 1 ? 'entry' : 'entries'}
                  {filteredExpenses.length > 0 && ` · ₪${totalExpenses.toFixed(2)}`}
                </span>
              </div>
              {isLoading ? (
                <Skeleton className="h-20 w-full rounded-xl" />
              ) : filteredExpenses.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-100 p-6 text-center">
                  <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No expenses this month</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredExpenses.map(expense => (
                    <ExpenseEntryCard key={expense.id} entry={expense} onDelete={deleteExpenseMutation.mutate} onEdit={handleEditExpense} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ---- NANNY VIEW ---- */}
        {isNanny && (
          <>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> My Overtime Requests
                </h2>
                <span className="text-xs text-slate-500">{filteredOTRequests.length} this month</span>
              </div>
              {otReqLoading ? (
                <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
              ) : filteredOTRequests.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-100 p-8 text-center">
                  <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No requests this month</p>
                  <p className="text-slate-400 text-xs mt-1">Tap "Submit" to request extra hours</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOTRequests.map(req => (
                    <RequestCard key={req.id} request={req} type="overtime" />
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Receipt className="w-4 h-4" /> My Expense Requests
                </h2>
                <span className="text-xs text-slate-500">{filteredExpRequests.length} this month</span>
              </div>
              {expReqLoading ? (
                <Skeleton className="h-20 w-full rounded-xl" />
              ) : filteredExpRequests.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-100 p-6 text-center">
                  <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No expense requests this month</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredExpRequests.map(req => (
                    <RequestCard key={req.id} request={req} type="expense" />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Add Entry Menu */}
      {menuOpen && (
        <AddEntryMenu
          onClose={() => setMenuOpen(false)}
          onSelectOvertme={() => {
            setMenuOpen(false);
            if (isNanny) setRequestOTOpen(true);
            else setFormOpen(true);
          }}
          onSelectExpense={() => {
            setMenuOpen(false);
            if (isNanny) setRequestExpOpen(true);
            else setExpenseFormOpen(true);
          }}
        />
      )}

      {/* Employer Forms */}
      <OvertimeForm open={formOpen} onOpenChange={handleFormClose} onSubmit={saveMutation.mutate} settings={settings} isLoading={saveMutation.isPending} editingEntry={editingEntry} />
      <ExpenseForm open={expenseFormOpen} onOpenChange={(open) => { setExpenseFormOpen(open); if (!open) setEditingExpense(null); }} onSubmit={saveExpenseMutation.mutate} isLoading={saveExpenseMutation.isPending} editingEntry={editingExpense} />

      {/* Nanny Request Forms */}
      <RequestOvertimeForm open={requestOTOpen} onOpenChange={setRequestOTOpen} onSubmit={submitOTRequestMutation.mutate} settings={settings} isLoading={submitOTRequestMutation.isPending} />
      <RequestExpenseForm open={requestExpOpen} onOpenChange={setRequestExpOpen} onSubmit={submitExpRequestMutation.mutate} isLoading={submitExpRequestMutation.isPending} />
    </div>
  );
}