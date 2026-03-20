import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog";
import { CalendarIcon, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";
import TimePicker from './TimePicker';

export default function OvertimeForm({ open, onOpenChange, onSubmit, settings, isLoading, editingEntry }) {
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  // Populate form when editing
  React.useEffect(() => {
    if (editingEntry) {
      // Parse date safely to avoid timezone offset issues
      const [y, m, d] = (editingEntry.date?.split('T')[0] || editingEntry.date || '').split('-').map(Number);
      setDate(y ? new Date(y, m - 1, d) : new Date());
      setStartTime(editingEntry.start_time);
      setEndTime(editingEntry.end_time);
      setNotes(editingEntry.notes || '');
    } else {
      setDate(new Date());
      setStartTime('');
      setEndTime('');
      setNotes('');
    }
  }, [editingEntry, open]);

  const calculateDurationAndPay = () => {
    if (!startTime || !endTime) return { duration: 0, pay: 0 };
    
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    
    let totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (totalMinutes < 0) totalMinutes += 24 * 60; // Handle overnight
    
    // Round UP to nearest 10 minutes
    const roundedMinutes = Math.ceil(totalMinutes / 10) * 10;
    
    const hourlyRate = settings?.overtime_rate || 65;
    const pay = Math.round((roundedMinutes / 60) * hourlyRate);
    
    return { duration: roundedMinutes, pay };
  };

  const { duration, pay } = calculateDurationAndPay();
  const hours = Math.floor(duration / 60);
  const mins = duration % 60;

  const handleSubmit = () => {
    const { duration, pay } = calculateDurationAndPay();
    
    const isAdmin = currentUser?.role === 'admin';
    const data = {
      date: format(date, 'yyyy-MM-dd'),
      start_time: startTime,
      end_time: endTime,
      duration_minutes: duration,
      ot_pay: pay,
      notes: notes.trim() || null,
      status: isAdmin ? 'approved' : 'pending',
      submitted_by: currentUser?.email || '',
    };
    
    if (editingEntry) {
      onSubmit({ id: editingEntry.id, data });
    } else {
      if (!isAdmin) {
        base44.functions.invoke('notifyOnSubmission', {
          entity_type: 'OvertimeSession',
          entity_id: 'pending',
          submitter_email: currentUser?.email,
          submitter_name: currentUser?.full_name || currentUser?.email,
          entry_date: data.date,
          entry_type: 'overtime',
        }).catch(() => {});
      }
      onSubmit(data);
    }
  };

  const timeRegex = /^([01]?\d|2[0-3]):([0-5]\d)$/;
  const isValid = timeRegex.test(startTime) && timeRegex.test(endTime) && duration > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-900">
            {editingEntry ? 'Edit Overtime Entry' : 'Log Extra Time'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 py-4">
          {/* Date Picker */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Date</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "EEEE, MMMM d, yyyy") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    setDate(d);
                    setCalendarOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Time Pickers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Start Time</Label>
              <TimePicker value={startTime} onChange={setStartTime} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">End Time</Label>
              <TimePicker value={endTime} onChange={setEndTime} />
            </div>
          </div>
          
          {/* Duration Preview */}
          {duration > 0 && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Rounded Duration</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 mb-1">Overtime Pay</p>
                  <p className="text-lg font-semibold text-emerald-600">+₪{pay}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Late pickup, bath time..."
              className="resize-none"
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="flex-1 sm:flex-none"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!isValid || isLoading}
            className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-900"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : editingEntry ? 'Update Entry' : 'Save Entry'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}