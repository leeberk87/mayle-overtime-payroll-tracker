import React from 'react';
import { Clock, Receipt } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useLanguage } from '@/lib/LanguageContext';

export default function AddEntryMenu({ onSelectOvertme, onSelectExpense, onClose }) {
  const { t } = useLanguage();

  return (
    <BottomSheet open={true} onOpenChange={(v) => { if (!v) onClose(); }} title={t('addMenu.title')}>
      <div className="space-y-2 pb-2">
        <button
          onClick={onSelectOvertme}
          className="w-full flex items-center gap-4 min-h-[56px] p-4 rounded-xl border border-border hover:bg-accent transition-colors text-left"
        >
          <div className="p-2.5 bg-secondary rounded-lg">
            <Clock className="w-5 h-5 text-secondary-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{t('addMenu.overtimeLabel')}</p>
            <p className="text-sm text-muted-foreground">{t('addMenu.overtimeDesc')}</p>
          </div>
        </button>

        <button
          onClick={onSelectExpense}
          className="w-full flex items-center gap-4 min-h-[56px] p-4 rounded-xl border border-border hover:bg-accent transition-colors text-left"
        >
          <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <Receipt className="w-5 h-5 text-amber-600 dark:text-amber-500" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{t('addMenu.expenseLabel')}</p>
            <p className="text-sm text-muted-foreground">{t('addMenu.expenseDesc')}</p>
          </div>
        </button>
      </div>
    </BottomSheet>
  );
}
