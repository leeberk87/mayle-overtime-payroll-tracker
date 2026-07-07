import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from "sonner";
import useSettings from '@/hooks/useSettings';
import AddEntryMenu from '@/components/overtime/AddEntryMenu';
import OvertimeForm from '@/components/overtime/OvertimeForm';
import ExpenseForm from '@/components/overtime/ExpenseForm';

export default function GlobalEntryModals() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const queryClient = useQueryClient();

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

  // Rate snapshot for the month being edited (or the current month for new entries)
  const editingYM = editingEntry?.date ? String(editingEntry.date).slice(0, 7) : undefined;
  const { settings } = useSettings(editingYM);

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