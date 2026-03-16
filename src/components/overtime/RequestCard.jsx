import React, { useState } from 'react';
import { format } from 'date-fns';
import { Clock, Receipt, CheckCircle, XCircle, Clock3 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

const statusConfig = {
  pending:  { label: 'Pending',  icon: Clock3,       color: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved', icon: CheckCircle,  color: 'bg-emerald-100 text-emerald-700' },
  declined: { label: 'Declined', icon: XCircle,      color: 'bg-red-100 text-red-700' },
};

export default function RequestCard({ request, type }) {
  const { label, icon: Icon, color } = statusConfig[request.status] || statusConfig.pending;
  const isOT = type === 'overtime';

  const formatDuration = (minutes) => {
    if (!minutes) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isOT ? 'bg-slate-100' : 'bg-amber-50'}`}>
            {isOT ? <Clock className="w-4 h-4 text-slate-600" /> : <Receipt className="w-4 h-4 text-amber-600" />}
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">
              {isOT
                ? `${request.start_time} – ${request.end_time}`
                : request.description}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {request.date ? format(new Date(request.date), 'EEE, MMM d, yyyy') : ''}
            </p>
            {isOT && request.duration_minutes && (
              <p className="text-xs text-slate-500">{formatDuration(request.duration_minutes)} · ₪{request.ot_pay}</p>
            )}
            {!isOT && (
              <p className="text-xs text-emerald-600 font-medium">₪{request.amount?.toFixed(2)}</p>
            )}
            {request.notes && <p className="text-xs text-slate-400 mt-1 italic">"{request.notes}"</p>}
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${color}`}>
          <Icon className="w-3 h-3" />
          {label}
        </span>
      </div>
      {request.status === 'declined' && request.employer_notes && (
        <div className="mt-3 bg-red-50 border border-red-100 rounded-lg p-3">
          <p className="text-xs text-red-700"><span className="font-semibold">Reason:</span> {request.employer_notes}</p>
        </div>
      )}
    </div>
  );
}