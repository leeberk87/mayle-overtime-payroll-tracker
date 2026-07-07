import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import useSettings from '@/hooks/useSettings';
import { format } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, FileText, Receipt, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import { Link } from 'react-router-dom';

import usePullToRefresh from '@/hooks/usePullToRefresh';
import PullToRefreshIndicator from '@/components/PullToRefreshIndicator';
import AppHeader from '@/components/AppHeader';
import SalarySummaryCard from '@/components/overtime/SalarySummaryCard';
import OvertimeEntryCard from '@/components/overtime/OvertimeEntryCard';
import MonthSelector from '@/components/overtime/MonthSelector';
import ExpenseEntryCard from '@/components/overtime/ExpenseEntryCard';
import { useLanguage } from '@/lib/LanguageContext';

export default function Home() {
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();

  const isAdmin = currentUser?.role === 'admin';
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const queryClient = useQueryClient();

  // Salary settings snapshot that applies to the selected month (shared hook)
  const { settings, isLoading: settingsLoading } = useSettings(selectedMonth);

  // Fetch all overtime sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['overtime-sessions'],
    queryFn: () => base44.entities.OvertimeSession.list('-date'),
  });

  // Filter sessions by selected month (and by user if not admin).
  // Never show entries before the user is known — no data leaks while loading.
  const filteredSessions = useMemo(() => {
    if (!currentUser) return [];
    const selectedYM = format(selectedMonth, 'yyyy-MM');
    return sessions.filter(session => {
      const sessionYM = (session.date || '').slice(0, 7);
      const inMonth = sessionYM === selectedYM;
      const ownedByUser = isAdmin || session.submitted_by === currentUser.email;
      return inMonth && ownedByUser;
    });
  }, [sessions, selectedMonth, isAdmin, currentUser]);

  // Totals count approved entries only, matching the monthly email and PDF.
  // Pending money is tracked separately so the card can show it as "awaiting approval".
  const { totalOtPay, totalOtHours, pendingOtPay } = useMemo(() => {
    const approved = filteredSessions.filter(s => s.status === 'approved');
    const pay = approved.reduce((sum, s) => sum + (s.ot_pay || 0), 0);
    const minutes = approved.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    const pending = filteredSessions
      .filter(s => s.status === 'pending')
      .reduce((sum, s) => sum + (s.ot_pay || 0), 0);
    return { totalOtPay: pay, totalOtHours: minutes / 60, pendingOtPay: pending };
  }, [filteredSessions]);

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
      toast.error(t('toasts.deleteEntryError'));
    },
    onSuccess: () => toast.success(t('toasts.entryDeleted')),
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
      toast.error(t('toasts.deletionRequestError'));
    },
    onSuccess: () => toast.success(t('toasts.deletionRequestSent')),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['overtime-sessions'] }),
  });

  // Fetch expenses
  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list('-date'),
  });

  // Filter expenses by month (and by user if not admin) — same no-leak rule as sessions
  const filteredExpenses = useMemo(() => {
    if (!currentUser) return [];
    const selectedYM = format(selectedMonth, 'yyyy-MM');
    return expenses.filter(e => {
      const expenseYM = (e.date || '').slice(0, 7);
      const inMonth = expenseYM === selectedYM;
      const ownedByUser = isAdmin || e.submitted_by === currentUser.email;
      return inMonth && ownedByUser;
    });
  }, [expenses, selectedMonth, isAdmin, currentUser]);

  const totalExpenses = useMemo(() =>
    filteredExpenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + (e.amount || 0), 0),
  [filteredExpenses]);

  const pendingExpenseTotal = useMemo(() =>
    filteredExpenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + (e.amount || 0), 0),
  [filteredExpenses]);

  const pendingCount = useMemo(() => {
    const ps = filteredSessions.filter(s => s.status === 'pending' || s.deletion_requested).length;
    const pe = filteredExpenses.filter(e => e.status === 'pending' || e.deletion_requested).length;
    return ps + pe;
  }, [filteredSessions, filteredExpenses]);

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
      toast.error(t('toasts.expenseDeleteError'));
    },
    onSuccess: () => toast.success(t('toasts.expenseDeleted')),
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
      toast.error(t('toasts.deletionRequestError'));
    },
    onSuccess: () => toast.success(t('toasts.deletionRequestSent')),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  });

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['overtime-sessions'] }),
      queryClient.invalidateQueries({ queryKey: ['expenses'] }),
      queryClient.invalidateQueries({ queryKey: ['settings'] }),
    ]);
  };

  const handleEdit = (entry) => {
    window.dispatchEvent(new CustomEvent('open-add-entry-menu', { detail: { type: 'edit-overtime', entry } }));
  };

  const handleEditExpense = (expense) => {
    window.dispatchEvent(new CustomEvent('open-add-entry-menu', { detail: { type: 'edit-expense', entry: expense } }));
  };

  const isLoading = settingsLoading || sessionsLoading || expensesLoading;

  const { pullProgress, isRefreshing } = usePullToRefresh(() => {
    queryClient.invalidateQueries();
  });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Mayle" subtitle={t('home.subtitle')} />
      <PullToRefreshIndicator pullProgress={pullProgress} isRefreshing={isRefreshing} />

      <div className="px-4 md:px-6 py-6 space-y-6">
        {/* Admin pending banner */}
        {isAdmin && pendingCount > 0 && (
          <Link to="/ApprovalDashboard">
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ClipboardCheck className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                <div>
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                    {t('home.pendingBanner', { count: pendingCount, entry: pendingCount === 1 ? t('home.pendingEntry') : t('home.pendingEntries') })}
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400">{t('home.tapToReview')}</p>
                </div>
              </div>
              <span className="text-amber-600 dark:text-amber-500 text-xs font-medium">{t('home.review')}</span>
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
            pendingTotal={pendingOtPay + pendingExpenseTotal}
          />
        )}

        {/* Overtime Entries */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {t('home.overtimeEntries')}
            </h2>
            <span className="text-xs text-muted-foreground">
              {filteredSessions.length} {filteredSessions.length === 1 ? t('home.entry') : t('home.entries')}
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
              <p className="text-muted-foreground text-sm">{t('home.noOvertimeEntries')}</p>
              <p className="text-muted-foreground/70 text-xs mt-1">
                {t('home.noOvertimeHint')}
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
              {t('home.expenseReimbursements')}
            </h2>
            <span className="text-xs text-muted-foreground">
              {filteredExpenses.length} {filteredExpenses.length === 1 ? t('home.entry') : t('home.entries')}
              {filteredExpenses.length > 0 && ` · ₪${Math.round(totalExpenses)}`}
            </span>
          </div>

          {isLoading ? (
            <Skeleton className="h-20 w-full rounded-xl" />
          ) : filteredExpenses.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-6 text-center">
              <Receipt className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">{t('home.noExpenses')}</p>
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

    </div>
  );
}