import React, { useState } from 'react';
import { BottomSheet } from './BottomSheet';
import { Check, ChevronDown } from 'lucide-react';

export default function BottomSheetSelect({ value, onValueChange, options, placeholder, title, disabled, triggerClassName }) {
  const [open, setOpen] = useState(false);

  const selectedOption = options.find(o => o.value === value);
  const displayLabel = selectedOption?.label || placeholder || 'Select...';

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(true)}
        className={`flex items-center justify-between w-full rounded-lg border border-slate-200 bg-white px-3 text-sm transition-colors active:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed ${triggerClassName || 'h-11'}`}
      >
        <span className={selectedOption ? 'text-slate-900' : 'text-slate-400'}>{displayLabel}</span>
        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
      </button>

      <BottomSheet open={open} onOpenChange={setOpen} title={title || placeholder || 'Select'}>
        <div className="space-y-1 pb-2">
          {options.map(option => (
            <button
              key={option.value}
              onClick={() => {
                onValueChange(option.value);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between min-h-[48px] px-4 py-3 rounded-xl text-left transition-colors ${
                value === option.value
                  ? 'bg-slate-100 text-slate-900 font-medium'
                  : 'text-slate-700 active:bg-slate-50'
              }`}
            >
              <span className="text-sm">{option.label}</span>
              {value === option.value && <Check className="w-4 h-4 text-slate-600" />}
            </button>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}