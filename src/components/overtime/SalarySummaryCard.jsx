import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Car, Clock, TrendingUp, Receipt } from "lucide-react";
import { useLanguage } from '@/lib/LanguageContext';

export default function SalarySummaryCard({ settings, totalOtPay, totalOtHours, totalExpenses = 0, pendingTotal = 0 }) {
  const { t } = useLanguage();
  const baseSalary = settings?.base_salary || 0;
  const transport = settings?.transport_allowance || 0;
  const grandTotal = baseSalary + transport + totalOtPay + totalExpenses;

  const otHoursDisplay = totalOtHours > 0
    ? `${Math.floor(totalOtHours)}h ${Math.round((totalOtHours % 1) * 60)}m`
    : '0h';

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white border-0 shadow-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-slate-200 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          {t('summaryCard.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* On mobile: 2×2 grid. On desktop: single row of 4. */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-slate-300 text-xs mb-1">
              <Wallet className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{t('summaryCard.baseSalary')}</span>
            </div>
            <p className="text-xl font-semibold">₪{baseSalary.toLocaleString()}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-slate-300 text-xs mb-1">
              <Car className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{t('summaryCard.transport')}</span>
            </div>
            <p className="text-xl font-semibold">₪{transport.toLocaleString()}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-slate-300 text-xs mb-1">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{t('summaryCard.overtimePay')}</span>
            </div>
            <p className="text-xl font-semibold text-emerald-400">+₪{totalOtPay.toLocaleString()}</p>
            {totalOtHours > 0 && (
              <p className="text-xs text-slate-400 mt-0.5">{t('summaryCard.worked', { hours: otHoursDisplay })}</p>
            )}
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-slate-300 text-xs mb-1">
              <Receipt className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{t('summaryCard.expenses')}</span>
            </div>
            <p className="text-xl font-semibold text-orange-400">+₪{totalExpenses.toLocaleString()}</p>
          </div>
        </div>

        {/* Money submitted but not yet approved — kept out of the grand total */}
        {pendingTotal > 0 && (
          <div className="flex justify-between items-center text-xs text-amber-300/90">
            <span>{t('summaryCard.pendingApproval')}</span>
            <span className="font-medium">₪{pendingTotal.toLocaleString()}</span>
          </div>
        )}

        <div className="border-t border-white/20 pt-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-300 text-sm">{t('summaryCard.grandTotal')}</span>
            <span className="text-3xl font-bold">₪{grandTotal.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
