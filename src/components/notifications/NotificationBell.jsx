import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
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
    submission: 'bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/50',
    approval: 'bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900/50',
    decline: 'bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/50',
    monthly_summary: 'bg-purple-50 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900/50',
  };

  return (
    <>
      <button
        onClick={() => handleOpen(true)}
        className="relative flex items-center justify-center w-11 h-11 rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <BottomSheet open={open} onOpenChange={handleOpen} title="Notifications">
        <div className="max-h-[60vh] overflow-y-auto overscroll-contain -mx-1">
          {notifications.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">No notifications yet</div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={`p-3 rounded-xl mb-1 ${typeColors[n.type] || 'bg-secondary border-border'} border ${!n.is_read ? 'font-medium' : ''}`}>
                <p className="text-sm text-foreground">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {n.created_date ? format(new Date(n.created_date), 'MMM d, h:mm a') : ''}
                </p>
              </div>
            ))
          )}
        </div>
      </BottomSheet>
    </>
  );
}