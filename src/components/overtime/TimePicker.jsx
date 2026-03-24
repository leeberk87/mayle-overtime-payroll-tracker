import React from 'react';
import BottomSheetSelect from '@/components/ui/BottomSheetSelect';
import { Clock } from 'lucide-react';

const hourOptions = Array.from({ length: 24 }, (_, i) => {
  const val = String(i).padStart(2, '0');
  return { value: val, label: val };
});

const minuteOptions = ['00', '10', '20', '30', '40', '50'].map(m => ({
  value: m,
  label: m,
}));

export default function TimePicker({ value, onChange }) {
  const [hour, minute] = value ? value.split(':') : ['', ''];

  const handleHour = (h) => {
    onChange(`${h}:${minute || '00'}`);
  };

  const handleMinute = (m) => {
    onChange(`${hour || '00'}:${m}`);
  };

  return (
    <div className="flex items-center gap-1">
      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
      <BottomSheetSelect
        value={hour}
        onValueChange={handleHour}
        options={hourOptions}
        placeholder="HH"
        title="Select Hour"
        triggerClassName="h-11 w-20"
      />
      <span className="text-slate-500 font-semibold">:</span>
      <BottomSheetSelect
        value={minute}
        onValueChange={handleMinute}
        options={minuteOptions}
        placeholder="MM"
        title="Select Minute"
        triggerClassName="h-11 w-20"
      />
    </div>
  );
}