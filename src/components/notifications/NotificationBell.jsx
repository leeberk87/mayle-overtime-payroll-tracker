import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';

export default function NotificationBell({ userEmail }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', userEmail],
    queryFn: () => base44.entities.Notification.filter({ recipient_email: userEmail }, '-created_date', 20),
    enabled: !!userEmail,
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', userEmail] }),
  });

  const handleOpen = (isOpen) => {
    setOpen(isOpen);
    if (isOpen) {
      notifications.filter(n => !n.is_read).forEach(n => markReadMutation.mutate(n.id));
    }
  };

  const typeColors = {
    submission: 'bg-blue-50 border-blue-100',
    approval: 'bg-green-50 border-green-100',
    decline: 'bg-red-50 border-red-100',
    monthly_summary: 'bg-purple-50 border-purple-100',
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-slate-600">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm">No notifications yet</div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={`p-3 border-b border-slate-50 ${typeColors[n.type] || ''} ${!n.is_read ? 'font-medium' : ''}`}>
                <p className="text-sm text-slate-800">{n.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {n.created_date ? format(new Date(n.created_date), 'MMM d, h:mm a') : ''}
                </p>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}