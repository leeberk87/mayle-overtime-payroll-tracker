import React, { useState } from 'react';
import { format } from 'date-fns';
import { Clock, Receipt, Check, X, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function ReviewRequestCard({ request, type, onApprove, onDecline }) {
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [reason, setReason] = useState('');
  const isOT = type === 'overtime';

  const formatDuration = (minutes) => {
    if (!minutes) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const handleDecline = () => {
    onDecline(request.id, reason);
    setShowDeclineForm(false);
    setReason('');
  };

  return (
    <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm">
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
              {request.submitted_by_name && <span className="font-medium">{request.submitted_by_name} · </span>}
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
      </div>

      {!showDeclineForm && (
        <div className="flex gap-2 mt-4">
          <Button size="sm" onClick={() => onApprove(request.id)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
            <Check className="w-3.5 h-3.5 mr-1" /> Approve
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowDeclineForm(true)} className="flex-1 border-red-200 text-red-600 hover:bg-red-50">
            <X className="w-3.5 h-3.5 mr-1" /> Decline
          </Button>
        </div>
      )}

      {showDeclineForm && (
        <div className="mt-4 space-y-3">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for declining (required)"
            className="resize-none text-sm"
            rows={2}
          />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowDeclineForm(false)} className="flex-1">Cancel</Button>
            <Button size="sm" onClick={handleDecline} disabled={!reason.trim()} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
              <X className="w-3.5 h-3.5 mr-1" /> Confirm Decline
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}