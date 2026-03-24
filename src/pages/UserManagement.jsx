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

export default function UserManagement() {
  const [currentUser, setCurrentUser] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [inviting, setInviting] = useState(false);
  const queryClient = useQueryClient();

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
      toast.success('Role updated');
    },
    onError: () => toast.error('Failed to update role'),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id) => base44.entities.User.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User removed');
    },
    onError: () => toast.error('Failed to remove user'),
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
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteRole('user');
      setInviteOpen(false);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    } catch {
      toast.error('Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Access denied. Admins only.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader
        title="User Management"
        subtitle={`${users.length} ${users.length === 1 ? 'user' : 'users'} total`}
        backPath="/Settings"
        rightContent={
          <Button onClick={() => setInviteOpen(true)} className="gap-2">
            <UserPlus className="w-4 h-4" />
            Invite
          </Button>
        }
      />

      <div className="max-w-lg lg:max-w-3xl mx-auto px-4 py-6 space-y-8">

        {/* Active Users */}
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Active Users</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-white rounded-xl border border-slate-100 animate-pulse" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-100 p-10 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No users yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map(user => (
                <div key={user.id} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3 shadow-sm">
                  <div className="p-2 bg-slate-100 rounded-full flex-shrink-0">
                    {user.role === 'admin' ? (
                      <Shield className="w-4 h-4 text-slate-700" />
                    ) : (
                      <User className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm truncate">{user.full_name || '—'}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <BottomSheetSelect
                      value={user.role || 'user'}
                      onValueChange={(role) => updateRoleMutation.mutate({ id: user.id, role })}
                      disabled={user.id === currentUser?.id}
                      options={[{ value: 'user', label: 'User' }, { value: 'admin', label: 'Admin' }]}
                      title="Change Role"
                      triggerClassName="h-9 w-24 text-xs"
                    />

                    {user.id !== currentUser?.id && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove User?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove <strong>{user.full_name || user.email}</strong> from the app.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteUserMutation.mutate(user.id)} className="bg-red-500 hover:bg-red-600">Remove</AlertDialogAction>
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
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Invitations</h2>
            <div className="space-y-3">
              {enrichedInvitations.map(inv => {
                const isPending = inv.status === 'pending';
                const isAccepted = inv.status === 'accepted';
                const expiresDate = inv.expires_at ? new Date(inv.expires_at) : null;
                const sentDate = inv.sent_at ? new Date(inv.sent_at) : null;
                return (
                  <div key={inv.id} className={`bg-white rounded-xl border p-4 flex items-center gap-3 shadow-sm ${
                    isAccepted ? 'border-emerald-100' : inv.status === 'expired' ? 'border-slate-100 opacity-60' : 'border-amber-100'
                  }`}>
                    <div className={`p-2 rounded-full flex-shrink-0 ${
                      isAccepted ? 'bg-emerald-50' : inv.status === 'expired' ? 'bg-slate-100' : 'bg-amber-50'
                    }`}>
                      {isAccepted ? <CheckCircle className="w-4 h-4 text-emerald-600" /> :
                       inv.status === 'expired' ? <XCircle className="w-4 h-4 text-slate-400" /> :
                       <Clock className="w-4 h-4 text-amber-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-slate-800 text-sm truncate">{inv.email}</p>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                          isAccepted ? 'bg-emerald-100 text-emerald-700' :
                          inv.status === 'expired' ? 'bg-slate-100 text-slate-500' :
                          'bg-amber-100 text-amber-700'
                        }`}>{inv.status}</span>
                        <span className="text-[10px] text-slate-400 capitalize">{inv.role}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
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
      <BottomSheet open={inviteOpen} onOpenChange={setInviteOpen} title="Invite User">
        <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Email address</label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Role</label>
              <BottomSheetSelect
                value={inviteRole}
                onValueChange={setInviteRole}
                options={[{ value: 'user', label: 'User' }, { value: 'admin', label: 'Admin' }]}
                title="Select Role"
              />
            </div>
            <p className="text-xs text-slate-400">Invitations expire after 7 days.</p>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setInviteOpen(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()} className="flex-1">
                {inviting ? 'Sending...' : 'Send Invitation'}
              </Button>
            </div>
        </div>
      </BottomSheet>
    </div>
  );
}