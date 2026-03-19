import React, { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Clock, FileText, Receipt, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

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
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    
    return sessions.filter(session => {
      const sessionDate = new Date(session.date);
      const inMonth = isWithinInterval(sessionDate, { start: monthStart, end: monthEnd });
      const ownedByUser = isAdmin || !currentUser || session.submitted_by === currentUser.email;
      return inMonth && ownedByUser;
    });
  }, [sessions, selectedMonth, isAdmin, currentUser]);

  // Calculate totals (approved only)
  const { totalOtPay, totalOtHours } = useMemo(() => {
    const approved = filteredSessions.filter(s => s.status === 'approved');
    const pay = approved.reduce((sum, s) => sum + (s.ot_pay || 0), 0);
    const minutes = approved.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    return { totalOtPay: pay, totalOtHours: minutes / 60 };
  }, [filteredSessions]);

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: (payload) => {
      if (payload.id) {
        return base44.entities.OvertimeSession.update(payload.id, payload.data);
      }
      return base44.entities.OvertimeSession.create(payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['overtime-sessions'] });
      setFormOpen(false);
      setEditingEntry(null);
      toast.success(variables.id ? 'Entry updated!' : 'Overtime entry saved!');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.OvertimeSession.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overtime-sessions'] });
      toast.success('Entry deleted');
    },
  });

  // Request deletion mutation
  const requestOtDeletionMutation = useMutation({
    mutationFn: ({ id, reason }) => base44.entities.OvertimeSession.update(id, { deletion_requested: true, deletion_reason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overtime-sessions'] });
      toast.success('Deletion request submitted');
    },
  });

  // Fetch expenses
  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list('-date'),
  });

  // Filter expenses by month (and by user if not admin)
  const filteredExpenses = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    return expenses.filter(e => {
      const d = new Date(e.date);
      const inMonth = isWithinInterval(d, { start: monthStart, end: monthEnd });
      const ownedByUser = isAdmin || !currentUser || e.submitted_by === currentUser.email;
      return inMonth && ownedByUser;
    });
  }, [expenses, selectedMonth, isAdmin, currentUser]);

  const totalExpenses = useMemo(() =>
    filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0),
  [filteredExpenses]);

  const pendingCount = useMemo(() => {
    const ps = filteredSessions.filter(s => s.status === 'pending').length;
    const pe = filteredExpenses.filter(e => e.status === 'pending').length;
    return ps + pe;
  }, [filteredSessions, filteredExpenses]);

  // Save expense mutation
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

  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: (id) => base44.entities.Expense.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense deleted');
    },
  });

  // Request expense deletion mutation
  const requestExpenseDeletionMutation = useMutation({
    mutationFn: ({ id, reason }) => base44.entities.Expense.update(id, { deletion_requested: true, deletion_reason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Deletion request submitted');
    },
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Mayle</h1>
              <p className="text-xs text-slate-500">Overtime & Salary Tracker</p>
            </div>
            <Button 
              onClick={() => setMenuOpen(true)}
              className="bg-slate-800 hover:bg-slate-900 shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Admin pending banner */}
        {isAdmin && pendingCount > 0 && (
          <Link to={createPageUrl('ApprovalDashboard')}>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ClipboardCheck className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    {pendingCount} pending {pendingCount === 1 ? 'entry' : 'entries'}
                  </p>
                  <p className="text-xs text-amber-700">Tap to review and approve</p>
                </div>
              </div>
              <span className="text-amber-600 text-xs font-medium">Review →</span>
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
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Overtime Entries
            </h2>
            <span className="text-xs text-slate-500">
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
            <div className="bg-white rounded-xl border border-slate-100 p-8 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No overtime entries this month</p>
              <p className="text-slate-400 text-xs mt-1">
                Tap "Log Extra Time" to add one
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSessions.map(entry => (
                <OvertimeEntryCard 
                  key={entry.id} 
                  entry={entry}
                  onDelete={deleteMutation.mutate}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          )}
        </div>

        {/* Expense Entries */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Expense Reimbursements
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
                <ExpenseEntryCard
                  key={expense.id}
                  entry={expense}
                  onDelete={deleteExpenseMutation.mutate}
                  onEdit={handleEditExpense}
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