import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Car, Clock, TrendingUp, Receipt } from "lucide-react";

export default function SalarySummaryCard({ settings, totalOtPay, totalOtHours, totalExpenses = 0 }) {
  const basePlusTransport = (settings?.base_salary || 10000) + (settings?.transport_allowance || 250);
  const grandTotal = basePlusTransport + totalOtPay + totalExpenses;
  
  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white border-0 shadow-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-slate-200 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Monthly Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-slate-300 text-xs mb-1">
              <Wallet className="w-3.5 h-3.5" />
              Base Salary
            </div>
            <p className="text-xl font-semibold">
              ₪{(settings?.base_salary || 10000).toLocaleString()}
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-slate-300 text-xs mb-1">
              <Car className="w-3.5 h-3.5" />
              Transport
            </div>
            <p className="text-xl font-semibold">
              ₪{(settings?.transport_allowance || 250).toLocaleString()}
            </p>
          </div>
        </div>
        
        <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-slate-300 text-xs mb-1">
            <Clock className="w-3.5 h-3.5" />
            Overtime Pay ({totalOtHours.toFixed(1)} hrs @ ₪{settings?.overtime_rate || 65}/hr)
          </div>
          <p className="text-xl font-semibold text-emerald-400">
            +₪{totalOtPay.toLocaleString()}
          </p>
        </div>

        <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-slate-300 text-xs mb-1">
            <Receipt className="w-3.5 h-3.5" />
            Expense Reimbursements
          </div>
          <p className="text-xl font-semibold text-orange-400">
            +₪{totalExpenses.toLocaleString()}
          </p>
        </div>
        
        <div className="border-t border-white/20 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-300 text-sm">Grand Total</span>
            <span className="text-3xl font-bold">₪{grandTotal.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}