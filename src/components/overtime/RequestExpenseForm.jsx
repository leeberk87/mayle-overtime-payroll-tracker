import React, { useState } from 'react';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CalendarIcon, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RequestExpenseForm({ open, onOpenChange, onSubmit, isLoading }) {
  const [date, setDate] = useState(new Date());
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);

  React.useEffect(() => {
    if (!open) {
      setDate(new Date());
      setDescription('');
      setAmount('');
    }
  }, [open]);

  const isValid = description.trim() && amount && Number(amount) > 0;

  const handleSubmit = () => {
    onSubmit({
      date: format(date, 'yyyy-MM-dd'),
      description: description.trim(),
      amount: Number(amount),
      status: 'pending'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-900">Request Expense Reimbursement</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-4">
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-amber-800">
            This will be sent to your employer for approval.
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Date</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "EEEE, MMMM d, yyyy") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={(d) => { setDate(d); setCalendarOpen(false); }} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Lunch for children at the park" className="resize-none" rows={3} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₪</span>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="pl-8 text-lg font-semibold" placeholder="0" />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">
            <X className="w-4 h-4 mr-2" />Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isLoading} className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-900">
            <Send className="w-4 h-4 mr-2" />
            {isLoading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}