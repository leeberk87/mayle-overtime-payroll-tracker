import React, { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Clock, FileText, Receipt, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import { Link } from 'react-router-dom';

import usePullToRefresh from '@/hooks/usePullToRefresh';
import PullToRefreshIndicator from '@/components/PullToRefreshIndicator';
import AppHeader from '@/components/AppHeader';
import SalarySummaryCard from '@/components/overtime/SalarySummaryCard';
import OvertimeEntryCard from '@/components/overtime/OvertimeEntryCard';
import OvertimeForm from '@/components/overtime/OvertimeForm';
import MonthSelector from '@/components/overtime/MonthSelector';
import AddEntryMenu from '@/components/overtime/AddEntryMenu';
import ExpenseForm from '@/components/overtime/ExpenseForm';
import ExpenseEntryCard from '@/components/overtime/ExpenseEntryCard';

export default function Home() {
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => { base44.auth.me().then(setCurrentUser).catch(() => {}); }, []);

  useEffect(() => {
    const handler = () => setMenuOpen(true);
    window.addEventListener('open-add-entry-menu', handler);
    return () => window.removeEventListener('open-add-entry-menu', handler);
  }, []);

  const isAdmin = currentUser?.role === 'admin';
  const [menuOpen, setMenuOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const queryClient = useQueryClient();

  // Fetch all settings snapshots (sorted newest first)
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => base44.entities.AppSettings.list('-effective_from'),
  });

  // Find the most recent settings snapshot that is <= selected month
  const settings = useMemo(() => {
    if (!settingsData?.length) return { base_salary: 10000, transport_allowance: 250, overtime_rate: 65 };
    const selectedYM = format(selectedMonth, 'yyyy-MM');
    const match = settingsData.find(s => !s.effective_from || s.effective_from <= selectedYM);
    return match || settingsData[settingsData.length - 1] || { base_salary: 10000, transport_allowance: 250, overtime_rate: 65 };
  }, [settingsData, selectedMonth]);

  // Fetch all overtime sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['overtime-sessions'],
    queryFn: () => base44.entities.OvertimeSession.list('-date'),
  });

  // Filter sessions by selected month (and by user if not admin)
  const filteredSessions = useMemo(() => {
    const selectedYM = format(selectedMonth, 'yyyy-MM');
    return sessions.filter(session => {
      const sessionYM = (session.date || '').slice(0, 7);
      const inMonth = sessionYM === selectedYM;
      const ownedByUser = isAdmin || !currentUser || session.submitted_by === currentUser.email;
      return inMonth && ownedByUser;
    });
  }, [sessions, selectedMonth, isAdmin, currentUser]);

  // Calculate totals (approved + pending, exclude declined)
  const { totalOtPay, totalOtHours } = useMemo(() => {
    const countable = filteredSessions.filter(s => s.status !== 'declined');
    const pay = countable.reduce((sum, s) => sum + (s.ot_pay || 0), 0);
    const minutes = countable.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    return { totalOtPay: pay, totalOtHours: minutes / 60 };
  }, [filteredSessions]);

  // Create/Update mutation (optimistic)
  const saveMutation = useMutation({
    mutationFn: (payload) => {
      if (payload.id) return base44.entities.OvertimeSession.update(payload.id, payload.data);
      return base44.entities.OvertimeSession.create(payload);
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['overtime-sessions'] });
      const prev = queryClient.getQueryData(['overtime-sessions']);
      queryClient.setQueryData(['overtime-sessions'], (old = []) => {
        if (payload.id) return old.map(s => s.id === payload.id ? { ...s, ...payload.data } : s);
        return [{ ...payload, id: `optimistic-${Date.now()}`, status: payload.status || 'pending' }, ...old];
      });
      return { prev };
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['overtime-sessions'], ctx.prev);
      toast.error('Failed to save entry. Please try again.');
    },
    onSuccess: (_, variables) => {
      setFormOpen(false);
      setEditingEntry(null);
      toast.success(variables.id ? 'Entry updated!' : 'Overtime entry saved!');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['overtime-sessions'] }),
  });

  // Delete mutation (optimistic)
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.OvertimeSession.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['overtime-sessions'] });
      const prev = queryClient.getQueryData(['overtime-sessions']);
      queryClient.setQueryData(['overtime-sessions'], (old = []) => old.filter(s => s.id !== id));
      return { prev };
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['overtime-sessions'], ctx.prev);
      toast.error('Failed to delete entry. Please try again.');
    },
    onSuccess: () => toast.success('Entry deleted'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['overtime-sessions'] }),
  });

  // Request deletion mutation (optimistic)
  const requestOtDeletionMutation = useMutation({
    mutationFn: ({ id, reason }) => base44.entities.OvertimeSession.update(id, { deletion_requested: true, deletion_reason: reason }),
    onMutate: async ({ id, reason }) => {
      await queryClient.cancelQueries({ queryKey: ['overtime-sessions'] });
      const prev = queryClient.getQueryData(['overtime-sessions']);
      queryClient.setQueryData(['overtime-sessions'], (old = []) =>
        old.map(s => s.id === id ? { ...s, deletion_requested: true, deletion_reason: reason } : s)
      );
      return { prev };
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['overtime-sessions'], ctx.prev);
      toast.error('Failed to submit deletion request. Please try again.');
    },
    onSuccess: () => toast.success('Deletion request submitted'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['overtime-sessions'] }),
  });

  // Fetch expenses
  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list('-date'),
  });

  // Filter expenses by month (and by user if not admin)
  const filteredExpenses = useMemo(() => {
    const selectedYM = format(selectedMonth, 'yyyy-MM');
    return expenses.filter(e => {
      const expenseYM = (e.date || '').slice(0, 7);
      const inMonth = expenseYM === selectedYM;
      const ownedByUser = isAdmin || !currentUser || e.submitted_by === currentUser.email;
      return inMonth && ownedByUser;
    });
  }, [expenses, selectedMonth, isAdmin, currentUser]);

  const totalExpenses = useMemo(() =>
    filteredExpenses.filter(e => e.status !== 'declined').reduce((sum, e) => sum + (e.amount || 0), 0),
  [filteredExpenses]);

  const pendingCount = useMemo(() => {
    const ps = filteredSessions.filter(s => s.status === 'pending' || s.deletion_requested).length;
    const pe = filteredExpenses.filter(e => e.status === 'pending' || e.deletion_requested).length;
    return ps + pe;
  }, [filteredSessions, filteredExpenses]);

  // Save expense mutation (optimistic)
  const saveExpenseMutation = useMutation({
    mutationFn: (payload) => {
      if (payload.id) return base44.entities.Expense.update(payload.id, payload.data);
      return base44.entities.Expense.create(payload);
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['expenses'] });
      const prev = queryClient.getQueryData(['expenses']);
      queryClient.setQueryData(['expenses'], (old = []) => {
        if (payload.id) return old.map(e => e.id === payload.id ? { ...e, ...payload.data } : e);
        return [{ ...payload, id: `optimistic-${Date.now()}`, status: 'pending' }, ...old];
      });
      return { prev };
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['expenses'], ctx.prev);
      toast.error('Failed to save expense. Please try again.');
    },
    onSuccess: (_, variables) => {
      setExpenseFormOpen(false);
      setEditingExpense(null);
      toast.success(variables.id ? 'Expense updated!' : 'Expense saved!');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  });

  // Delete expense mutation (optimistic)
  const deleteExpenseMutation = useMutation({
    mutationFn: (id) => base44.entities.Expense.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['expenses'] });
      const prev = queryClient.getQueryData(['expenses']);
      queryClient.setQueryData(['expenses'], (old = []) => old.filter(e => e.id !== id));
      return { prev };
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['expenses'], ctx.prev);
      toast.error('Failed to delete expense. Please try again.');
    },
    onSuccess: () => toast.success('Expense deleted'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  });

  // Request expense deletion mutation (optimistic)
  const requestExpenseDeletionMutation = useMutation({
    mutationFn: ({ id, reason }) => base44.entities.Expense.update(id, { deletion_requested: true, deletion_reason: reason }),
    onMutate: async ({ id, reason }) => {
      await queryClient.cancelQueries({ queryKey: ['expenses'] });
      const prev = queryClient.getQueryData(['expenses']);
      queryClient.setQueryData(['expenses'], (old = []) =>
        old.map(e => e.id === id ? { ...e, deletion_requested: true, deletion_reason: reason } : e)
      );
      return { prev };
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['expenses'], ctx.prev);
      toast.error('Failed to submit deletion request. Please try again.');
    },
    onSuccess: () => toast.success('Deletion request submitted'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  });

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setFormOpen(true);
  };

  const handleFormClose = (open) => {
    setFormOpen(open);
    if (!open) setEditingEntry(null);
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseFormOpen(true);
  };

  const isLoading = settingsLoading || sessionsLoading || expensesLoading;

  const { pullProgress, isRefreshing } = usePullToRefresh(() => {
    queryClient.invalidateQueries();
  });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Mayle" subtitle="Overtime & Salary Tracker" />
      <PullToRefreshIndicator pullProgress={pullProgress} isRefreshing={isRefreshing} />

      <div className="max-w-lg lg:max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Admin pending banner */}
        {isAdmin && pendingCount > 0 && (
          <Link to="/ApprovalDashboard">
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ClipboardCheck className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                <div>
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                    {pendingCount} pending {pendingCount === 1 ? 'entry' : 'entries'}
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400">Tap to review and approve</p>
                </div>
              </div>
              <span className="text-amber-600 dark:text-amber-500 text-xs font-medium">Review →</span>
            </div>
          </Link>
        )}

        {/* Month Selector */}
        <MonthSelector 
          currentMonth={selectedMonth} 
          onChange={setSelectedMonth} 
        />

        {/* Salary Summary */}
        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : (
          <SalarySummaryCard 
            settings={settings} 
            totalOtPay={totalOtPay}
            totalOtHours={totalOtHours}
            totalExpenses={totalExpenses}
          />
        )}

        {/* Overtime Entries */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Overtime Entries
            </h2>
            <span className="text-xs text-muted-foreground">
              {filteredSessions.length} {filteredSessions.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No overtime entries this month</p>
              <p className="text-muted-foreground/70 text-xs mt-1">
                Tap "Log Extra Time" to add one
              </p>
            </div>
          ) : (
            <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
              {filteredSessions.map(entry => (
                <OvertimeEntryCard
                  key={entry.id}
                  entry={entry}
                  isAdmin={isAdmin}
                  onDelete={deleteMutation.mutate}
                  onEdit={handleEdit}
                  onRequestDeletion={(id, reason) => requestOtDeletionMutation.mutate({ id, reason })}
                />
              ))}
            </div>
          )}
        </div>

        {/* Expense Entries */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Expense Reimbursements
            </h2>
            <span className="text-xs text-muted-foreground">
              {filteredExpenses.length} {filteredExpenses.length === 1 ? 'entry' : 'entries'}
              {filteredExpenses.length > 0 && ` · ₪${Math.round(totalExpenses)}`}
            </span>
          </div>

          {isLoading ? (
            <Skeleton className="h-20 w-full rounded-xl" />
          ) : filteredExpenses.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-6 text-center">
              <Receipt className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No expenses this month</p>
            </div>
          ) : (
            <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
              {filteredExpenses.map(expense => (
                <ExpenseEntryCard
                  key={expense.id}
                  entry={expense}
                  isAdmin={isAdmin}
                  onDelete={deleteExpenseMutation.mutate}
                  onEdit={handleEditExpense}
                  onRequestDeletion={(id, reason) => requestExpenseDeletionMutation.mutate({ id, reason })}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Entry Menu - outside main wrapper, covers full screen */}
      {menuOpen && (
        <AddEntryMenu
          onClose={() => setMenuOpen(false)}
          onSelectOvertme={() => { setMenuOpen(false); setFormOpen(true); }}
          onSelectExpense={() => { setMenuOpen(false); setExpenseFormOpen(true); }}
        />
      )}

      {/* Overtime Form Modal */}
      <OvertimeForm 
        open={formOpen}
        onOpenChange={handleFormClose}
        onSubmit={saveMutation.mutate}
        settings={settings}
        isLoading={saveMutation.isPending}
        editingEntry={editingEntry}
      />

      {/* Expense Form Modal */}
      <ExpenseForm
        open={expenseFormOpen}
        onOpenChange={(open) => { setExpenseFormOpen(open); if (!open) setEditingExpense(null); }}
        onSubmit={saveExpenseMutation.mutate}
        isLoading={saveExpenseMutation.isPending}
        editingEntry={editingExpense}
      />
    </div>
  );
}