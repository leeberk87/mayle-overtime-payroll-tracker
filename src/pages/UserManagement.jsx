import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { BottomSheet } from '@/components/ui/BottomSheet';
import BottomSheetSelect from '@/components/ui/BottomSheetSelect';
import { Users, UserPlus, Trash2, Shield, User, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { useLanguage } from '@/lib/LanguageContext';

export default function UserManagement() {
  const [currentUser, setCurrentUser] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [inviting, setInviting] = useState(false);
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: invitations = [] } = useQuery({
    queryKey: ['invitations'],
    queryFn: () => base44.entities.Invitation.list('-sent_at'),
  });

  const userEmails = new Set(users.map(u => u.email));
  const enrichedInvitations = invitations.map(inv => ({
    ...inv,
    status: inv.status === 'pending' && userEmails.has(inv.email) ? 'accepted' : inv.status,
  }));

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }) => base44.entities.User.update(id, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('userManagement.toastRoleUpdated'));
    },
    onError: () => toast.error(t('userManagement.toastRoleError')),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id) => base44.entities.User.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('userManagement.toastUserRemoved'));
    },
    onError: () => toast.error(t('userManagement.toastUserRemoveError')),
  });

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await base44.users.inviteUser(inviteEmail.trim(), inviteRole);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      await base44.entities.Invitation.create({
        email: inviteEmail.trim(),
        role: inviteRole,
        status: 'pending',
        sent_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        invited_by: currentUser?.email,
      });
      toast.success(t('userManagement.toastInviteSent', { email: inviteEmail }));
      setInviteEmail('');
      setInviteRole('user');
      setInviteOpen(false);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    } catch {
      toast.error(t('userManagement.toastInviteError'));
    } finally {
      setInviting(false);
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Access denied. Admins only.</p>
      </div>
    );
  }

  const roleOptions = [
    { value: 'user', label: t('userManagement.roleUser') },
    { value: 'admin', label: t('userManagement.roleAdmin') },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title={t('userManagement.title')}
        subtitle={t('userManagement.subtitle', {
          count: users.length,
          user: users.length === 1 ? t('userManagement.user') : t('userManagement.users'),
        })}
        backPath="/Settings"
        rightContent={
          <Button onClick={() => setInviteOpen(true)} className="gap-2">
            <UserPlus className="w-4 h-4" />
            {t('userManagement.invite')}
          </Button>
        }
      />

      <div className="max-w-lg lg:max-w-3xl mx-auto px-4 py-6 space-y-8">

        {/* Active Users */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">{t('userManagement.activeUsers')}</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-card rounded-xl border border-border animate-pulse" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-10 text-center">
              <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">{t('userManagement.noUsers')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map(user => (
                <div key={user.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3 shadow-sm">
                  <div className="p-2 bg-secondary rounded-full flex-shrink-0">
                    {user.role === 'admin' ? (
                      <Shield className="w-4 h-4 text-foreground" />
                    ) : (
                      <User className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{user.full_name || '—'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <BottomSheetSelect
                      value={user.role || 'user'}
                      onValueChange={(role) => updateRoleMutation.mutate({ id: user.id, role })}
                      disabled={user.id === currentUser?.id}
                      options={roleOptions}
                      title={t('userManagement.changeRole')}
                      triggerClassName="h-9 w-24 text-xs"
                    />

                    {user.id !== currentUser?.id && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('userManagement.removeUserTitle')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('userManagement.removeUserDesc', { name: user.full_name || user.email })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('userManagement.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteUserMutation.mutate(user.id)} className="bg-red-500 hover:bg-red-600">{t('userManagement.remove')}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invitations */}
        {enrichedInvitations.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">{t('userManagement.invitations')}</h2>
            <div className="space-y-3">
              {enrichedInvitations.map(inv => {
                const isPending = inv.status === 'pending';
                const isAccepted = inv.status === 'accepted';
                const expiresDate = inv.expires_at ? new Date(inv.expires_at) : null;
                const sentDate = inv.sent_at ? new Date(inv.sent_at) : null;
                return (
                  <div key={inv.id} className={`bg-card rounded-xl border p-4 flex items-center gap-3 shadow-sm ${
                    isAccepted ? 'border-emerald-100 dark:border-emerald-900/30' : inv.status === 'expired' ? 'border-border opacity-60' : 'border-amber-100 dark:border-amber-900/30'
                  }`}>
                    <div className={`p-2 rounded-full flex-shrink-0 ${
                      isAccepted ? 'bg-emerald-50 dark:bg-emerald-950/30' : inv.status === 'expired' ? 'bg-secondary' : 'bg-amber-50 dark:bg-amber-950/30'
                    }`}>
                      {isAccepted ? <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-500" /> :
                       inv.status === 'expired' ? <XCircle className="w-4 h-4 text-muted-foreground" /> :
                       <Clock className="w-4 h-4 text-amber-600 dark:text-amber-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground text-sm truncate">{inv.email}</p>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                          isAccepted ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-500' :
                          inv.status === 'expired' ? 'bg-secondary text-secondary-foreground' :
                          'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500'
                        }`}>{inv.status}</span>
                        <span className="text-[10px] text-muted-foreground capitalize">{inv.role}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Sent {sentDate ? formatDistanceToNow(sentDate, { addSuffix: true }) : '—'}
                        {isPending && expiresDate && ` · expires ${format(expiresDate, 'MMM d')}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Invite Bottom Sheet */}
      <BottomSheet open={inviteOpen} onOpenChange={setInviteOpen} title={t('userManagement.inviteSheetTitle')}>
        <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">{t('userManagement.emailLabel')}</label>
              <Input
                type="email"
                placeholder={t('userManagement.emailPlaceholder')}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">{t('userManagement.roleLabel')}</label>
              <BottomSheetSelect
                value={inviteRole}
                onValueChange={setInviteRole}
                options={roleOptions}
                title={t('userManagement.selectRole')}
              />
            </div>
            <p className="text-xs text-muted-foreground">{t('userManagement.inviteExpiry')}</p>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setInviteOpen(false)} className="flex-1">{t('userManagement.cancel')}</Button>
              <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()} className="flex-1">
                {inviting ? t('userManagement.sending') : t('userManagement.sendInvitation')}
              </Button>
            </div>
        </div>
      </BottomSheet>
    </div>
  );
}
