import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from "sonner";
import { format } from 'date-fns';
import AddEntryMenu from '@/components/overtime/AddEntryMenu';
import OvertimeForm from '@/components/overtime/OvertimeForm';
import ExpenseForm from '@/components/overtime/ExpenseForm';

export default function GlobalEntryModals() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.type === 'edit-overtime') {
        setEditingEntry(e.detail.entry);
        setFormOpen(true);
      } else if (e.detail?.type === 'edit-expense') {
        setEditingExpense(e.detail.entry);
        setExpenseFormOpen(true);
      } else {
        setMenuOpen(true);
      }
    };
    window.addEventListener('open-add-entry-menu', handler);
    return () => window.removeEventListener('open-add-entry-menu', handler);
  }, []);

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => base44.entities.AppSettings.list('-effective_from'),
  });

  const settings = useMemo(() => {
    if (!settingsData?.length) return { base_salary: 10000, transport_allowance: 250, overtime_rate: 65 };
    const dateToUse = editingEntry?.date ? new Date(editingEntry.date) : new Date();
    const selectedYM = format(dateToUse, 'yyyy-MM');
    const match = settingsData.find(s => !s.effective_from || s.effective_from <= selectedYM);
    return match || settingsData[settingsData.length - 1] || { base_salary: 10000, transport_allowance: 250, overtime_rate: 65 };
  }, [settingsData, editingEntry]);

  // Create/Update mutation (optimistic)
  const saveMutation = useMutation({
    mutationFn: (payload) => {
      if (payload.id) {
        return base44.entities.OvertimeSession.update(payload.id, { ...payload.data, organization_id: user?.organization_id });
      }
      return base44.entities.OvertimeSession.create({ ...payload, organization_id: user?.organization_id });
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

  // Save expense mutation (optimistic)
  const saveExpenseMutation = useMutation({
    mutationFn: (payload) => {
      if (payload.id) {
        return base44.entities.Expense.update(payload.id, { ...payload.data, organization_id: user?.organization_id });
      }
      return base44.entities.Expense.create({ ...payload, organization_id: user?.organization_id });
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

  return (
    <>
      {menuOpen && (
        <AddEntryMenu
          onClose={() => setMenuOpen(false)}
          onSelectOvertme={() => { setMenuOpen(false); setFormOpen(true); }}
          onSelectExpense={() => { setMenuOpen(false); setExpenseFormOpen(true); }}
        />
      )}
      <OvertimeForm 
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditingEntry(null); }}
        onSubmit={saveMutation.mutate}
        settings={settings}
        isLoading={saveMutation.isPending}
        editingEntry={editingEntry}
      />
      <ExpenseForm
        open={expenseFormOpen}
        onOpenChange={(open) => { setExpenseFormOpen(open); if (!open) setEditingExpense(null); }}
        onSubmit={saveExpenseMutation.mutate}
        isLoading={saveExpenseMutation.isPending}
        editingEntry={editingExpense}
      />
    </>
  );
}