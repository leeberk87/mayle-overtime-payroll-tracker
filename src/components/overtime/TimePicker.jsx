import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock } from 'lucide-react';

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const minutes = ['00', '10', '20', '30', '40', '50'];

export default function TimePicker({ value, onChange, placeholder = "HH:MM" }) {
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
      <Select value={hour} onValueChange={handleHour}>
        <SelectTrigger className="w-20 h-9">
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent className="max-h-48">
          {hours.map(h => (
            <SelectItem key={h} value={h}>{h}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-slate-500 font-semibold">:</span>
      <Select value={minute} onValueChange={handleMinute}>
        <SelectTrigger className="w-20 h-9">
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent>
          {minutes.map(m => (
            <SelectItem key={m} value={m}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}