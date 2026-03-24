import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format, subMonths, startOfMonth } from 'date-fns';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from 'lucide-react';

export default function ExpenseForm({ open, onOpenChange, onSubmit, isLoading, editingEntry }) {
  const [date, setDate] = useState(new Date());
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (editingEntry) {
      const [y, m, d] = (editingEntry.date?.split('T')[0] || editingEntry.date || '').split('-').map(Number);
      setDate(y ? new Date(y, m - 1, d) : new Date());
      setDescription(editingEntry.description || '');
      setAmount(String(editingEntry.amount || ''));
    } else {
      setDate(new Date());
      setDescription('');
      setAmount('');
    }
  }, [editingEntry, open]);

  const handleSubmit = () => {
    const isAdmin = currentUser?.role === 'admin';
    const payload = {
      date: format(date, 'yyyy-MM-dd'),
      description,
      amount: Number(amount),
      // When editing, preserve the existing status so an approved entry stays approved
      status: editingEntry ? editingEntry.status : (isAdmin ? 'approved' : 'pending'),
      submitted_by: currentUser?.email || '',
    };
    if (editingEntry) {
      onSubmit({ id: editingEntry.id, data: payload });
    } else {
      if (!isAdmin) {
        base44.functions.invoke('notifyOnSubmission', {
          entity_type: 'Expense',
          entity_id: 'pending',
          submitter_email: currentUser?.email,
          submitter_name: currentUser?.full_name || currentUser?.email,
          entry_date: payload.date,
          entry_type: 'expense',
        }).catch(() => {});
      }
      onSubmit(payload);
    }
  };

  const isValid = description.trim() && Number(amount) > 0 && !!currentUser;

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={editingEntry ? 'Edit Expense' : 'Add Expense'}>
      <div className="space-y-4">
          {/* Date */}
          <div className="space-y-1">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="w-4 h-4 mr-2 text-slate-400" />
                  {format(date, 'MMMM d, yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  disabled={(day) =>
                    day > new Date() ||
                    day < startOfMonth(subMonths(new Date(), 2))
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea
              placeholder="e.g. Lunch at the park, swimming pool entry..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <Label>Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₪</span>
              <Input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 text-lg font-semibold"
              />
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!isValid || isLoading}
            className="w-full bg-amber-600 hover:bg-amber-700 py-5"
          >
            {isLoading ? 'Saving...' : editingEntry ? 'Update Expense' : 'Save Expense'}
          </Button>
      </div>
    </BottomSheet>
  );
}