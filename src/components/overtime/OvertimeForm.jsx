import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { format, subMonths, startOfMonth } from 'date-fns';
import { useAuth } from '@/lib/AuthContext';
import { calculateOvertime } from '@/lib/payroll';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BottomSheet } from '@/components/ui/BottomSheet';
import { CalendarIcon, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import TimePicker from './TimePicker';
import { useLanguage } from '@/lib/LanguageContext';

export default function OvertimeForm({ open, onOpenChange, onSubmit, settings, isLoading, editingEntry }) {
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();

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

  const { duration, pay } = calculateOvertime(startTime, endTime, settings?.overtime_rate);
  const hours = Math.floor(duration / 60);
  const mins = duration % 60;

  const handleSubmit = () => {
    const isAdmin = currentUser?.role === 'admin';
    const newDate = format(date, 'yyyy-MM-dd');

    // A caregiver edit that changes date, times, or pay must go back through approval.
    // Only the admin (the approver) can change an entry without resetting its status.
    const materialChange = editingEntry && (
      newDate !== (editingEntry.date?.split('T')[0] || editingEntry.date) ||
      startTime !== editingEntry.start_time ||
      endTime !== editingEntry.end_time
    );
    const needsReapproval = editingEntry && !isAdmin && materialChange && editingEntry.status !== 'pending';

    const data = {
      date: newDate,
      start_time: startTime,
      end_time: endTime,
      duration_minutes: duration,
      ot_pay: pay,
      notes: notes.trim() || null,
      status: editingEntry
        ? (needsReapproval ? 'pending' : editingEntry.status)
        : (isAdmin ? 'approved' : 'pending'),
      // Editing must not change who the entry belongs to
      submitted_by: editingEntry ? editingEntry.submitted_by : (currentUser?.email || ''),
    };
    if (needsReapproval) data.review_notes = null;

    const notifyAdmins = () => {
      base44.functions.invoke('notifyOnSubmission', {
        entity_type: 'OvertimeSession',
        entity_id: editingEntry?.id || 'pending',
        submitter_email: currentUser?.email,
        submitter_name: currentUser?.full_name || currentUser?.email,
        entry_date: data.date,
        entry_type: 'overtime',
      }).catch(() => {});
    };

    if (editingEntry) {
      if (needsReapproval) notifyAdmins();
      onSubmit({ id: editingEntry.id, data });
    } else {
      if (!isAdmin) notifyAdmins();
      onSubmit(data);
    }
  };

  const timeRegex = /^([01]?\d|2[0-3]):([0-5]\d)$/;
  const timesEntered = timeRegex.test(startTime) && timeRegex.test(endTime);
  // Warn if both times are entered but duration rounds to 0 (under 8 min) or exceeds 12h cap
  const durationWarning = timesEntered && duration === 0 && startTime !== endTime;
  const isValid = timesEntered && duration > 0;

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={editingEntry ? t('overtimeForm.titleEdit') : t('overtimeForm.titleNew')}>
      <div className="space-y-5">
          {/* Date Picker */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">{t('overtimeForm.date')}</Label>
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
                  {date ? format(date, "EEEE, MMMM d, yyyy") : t('overtimeForm.pickDate')}
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
                  disabled={(day) =>
                    day > new Date() ||
                    day < startOfMonth(subMonths(new Date(), 2))
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Pickers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">{t('overtimeForm.startTime')}</Label>
              <TimePicker value={startTime} onChange={setStartTime} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">{t('overtimeForm.endTime')}</Label>
              <TimePicker value={endTime} onChange={setEndTime} />
            </div>
          </div>

          {/* Duration warning */}
          {durationWarning && (
            <p className="text-xs text-red-500">
              {t('overtimeForm.durationWarning')}
            </p>
          )}

          {/* Duration Preview */}
          {duration > 0 && (
            <div className="bg-secondary rounded-xl p-4 border border-border">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('overtimeForm.roundedDuration')}</p>
                  <p className="text-lg font-semibold text-foreground">
                    {hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground mb-1">{t('overtimeForm.overtimePay')}</p>
                  <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-500">+₪{pay}</p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">{t('overtimeForm.notes')}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('overtimeForm.notesPlaceholder')}
              className="resize-none"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              {t('overtimeForm.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isValid || isLoading}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? t('overtimeForm.saving') : editingEntry ? t('overtimeForm.update') : t('overtimeForm.save')}
            </Button>
          </div>
      </div>
    </BottomSheet>
  );
}
