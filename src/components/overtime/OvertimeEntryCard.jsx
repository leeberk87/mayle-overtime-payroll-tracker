import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Trash2, FileText, Pencil } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function OvertimeEntryCard({ entry, onDelete, onEdit }) {
  const duration = entry.duration_minutes || 0;
  const hours = Math.floor(duration / 60);
  const mins = duration % 60;
  const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  
  return (
    <Card className="bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-slate-900">
                {format(new Date(entry.date), 'EEE, MMM d')}
              </span>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {entry.start_time} – {entry.end_time}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{durationStr}</span>
              </div>
              <div className="text-emerald-600 font-semibold">
                +₪{entry.ot_pay?.toLocaleString()}
              </div>
            </div>
            
            {entry.notes && (
              <div className="mt-2 flex items-start gap-1.5 text-slate-500 text-xs">
                <FileText className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-2">{entry.notes}</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onEdit(entry)}
              className="text-slate-400 hover:text-blue-600 hover:bg-blue-50"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-slate-400 hover:text-red-500 hover:bg-red-50 -mr-2"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Entry</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this overtime entry? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => onDelete(entry.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}