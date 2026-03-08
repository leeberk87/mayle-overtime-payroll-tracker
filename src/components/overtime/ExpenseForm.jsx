import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

  useEffect(() => {
    if (editingEntry) {
      setDate(new Date(editingEntry.date));
      setDescription(editingEntry.description || '');
      setAmount(String(editingEntry.amount || ''));
    } else {
      setDate(new Date());
      setDescription('');
      setAmount('');
    }
  }, [editingEntry, open]);

  const handleSubmit = () => {
    const payload = {
      date: format(date, 'yyyy-MM-dd'),
      description,
      amount: Number(amount),
    };
    if (editingEntry) {
      onSubmit({ id: editingEntry.id, data: payload });
    } else {
      onSubmit(payload);
    }
  };

  const isValid = description.trim() && Number(amount) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>{editingEntry ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
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
                <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
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
      </DialogContent>
    </Dialog>
  );
}