import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { BottomSheet } from '@/components/ui/BottomSheet';
import BottomSheetSelect from '@/components/ui/BottomSheetSelect';
import { Users, UserPlus, Trash2, Shield, User, Clock, CheckCircle, XCircle, Link2, Copy, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { useLanguage } from '@/lib/LanguageContext';

const INVITE_TAB_EMAIL = 'email';
const INVITE_TAB_LINK = 'link';

export default function UserManagement() {
  const [currentUser, setCurrentUser] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteTab, setInviteTab] = useState(INVITE_TAB_LINK);

  // Email tab state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [inviting, setInviting] = useState(false);

  // Link tab state
  const [linkName, setLinkName] = useState('');
  const [generatedLink, setGeneratedLink] = useState(null);
  const [generatingLink, setGeneratingLink] = useState(false);

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
    // For email-based invites only: mark as accepted if a user with that email exists
    status: inv.status === 'pending' && inv.email?.includes('@') && userEmails.has(inv.email)
      ? 'accepted'
      : inv.status,
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

  // ── Email invite ──────────────────────────────────────────────────────────
  const handleEmailInvite = async () => {
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
        link_based: false,
      });
      toast.success(t('userManagement.toastInviteSent', { email: inviteEmail }));
      setInviteEmail('');
      setInviteRole('user');
      setInviteOpen(false);
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    } catch {
      toast.error(t('userManagement.toastInviteError'));
    } finally {
      setInviting(false);
    }
  };

  // ── Link invite ───────────────────────────────────────────────────────────
  const handleGenerateLink = async () => {
    setGeneratingLink(true);
    try {
      const token = crypto.randomUUID();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours
      // Store token in the email field (link invites have no email address).
      // Use expires_at for the 48h expiry. The employee's name goes in the URL
      // as a cosmetic param — no security risk since it's display-only.
      await base44.entities.Invitation.create({
        email: token,
        role: 'user',
        status: 'pending',
        sent_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        invited_by: currentUser?.email,
      });
      const nameParam = linkName.trim() ? `&name=${encodeURIComponent(linkName.trim())}` : '';
      const link = `${window.location.origin}/join?token=${token}${nameParam}`;
      setGeneratedLink(link);
      toast.success(t('userManagement.toastLinkCreated'));
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    } catch {
      toast.error(t('userManagement.toastLinkError'));
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCopyLink = async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      toast.success(t('userManagement.linkCopied'));
    } catch {
      toast.success(generatedLink);
    }
  };

  const handleShareLink = async () => {
    if (!generatedLink) return;
    const shareData = { title: 'Work tracker invitation', url: generatedLink };
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleRevokeLink = async (invitationId) => {
    try {
      await base44.entities.Invitation.update(invitationId, { status: 'expired' });
      toast.success(t('userManagement.toastLinkRevoked'));
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    } catch {
      toast.error(t('userManagement.toastInviteError'));
    }
  };

  const copyExistingLink = async (token) => {
    const link = `${window.location.origin}/join?token=${token}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success(t('userManagement.linkCopied'));
    } catch {
      toast.success(link);
    }
  };

  const shareExistingLink = async (token) => {
    const link = `${window.location.origin}/join?token=${token}`;
    const shareData = { title: 'Work tracker invitation', url: link };
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          copyExistingLink(token);
        }
      }
    } else {
      copyExistingLink(token);
    }
  };

  const handleCloseSheet = () => {
    setInviteOpen(false);
    setInviteEmail('');
    setInviteRole('user');
    setLinkName('');
    setGeneratedLink(null);
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
                // Link-based invites store a UUID in the email field — no '@' sign
                const isLink = inv.email && !inv.email.includes('@');
                const isClaimed = false; // status goes straight to 'accepted' when claimed

                return (
                  <div key={inv.id} className={`bg-card rounded-xl border p-4 shadow-sm ${
                    isAccepted ? 'border-emerald-100 dark:border-emerald-900/30'
                    : inv.status === 'expired' ? 'border-border opacity-60'
                    : isClaimed ? 'border-blue-100 dark:border-blue-900/30'
                    : 'border-amber-100 dark:border-amber-900/30'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full flex-shrink-0 ${
                        isAccepted ? 'bg-emerald-50 dark:bg-emerald-950/30'
                        : inv.status === 'expired' ? 'bg-secondary'
                        : isClaimed ? 'bg-blue-50 dark:bg-blue-950/30'
                        : 'bg-amber-50 dark:bg-amber-950/30'
                      }`}>
                        {isAccepted ? <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                          : inv.status === 'expired' ? <XCircle className="w-4 h-4 text-muted-foreground" />
                          : isLink ? <Link2 className={`w-4 h-4 ${isClaimed ? 'text-blue-600 dark:text-blue-500' : 'text-amber-600 dark:text-amber-500'}`} />
                          : <Clock className="w-4 h-4 text-amber-600 dark:text-amber-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-foreground text-sm truncate">
                            {isLink ? 'Invite link' : inv.email}
                          </p>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                            isAccepted ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-500'
                            : inv.status === 'expired' ? 'bg-secondary text-secondary-foreground'
                            : isClaimed ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-500'
                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500'
                          }`}>
                            {isClaimed ? 'claimed' : inv.status}
                          </span>
                          {isLink && <span className="text-[10px] text-muted-foreground">link</span>}
                          {!isLink && <span className="text-[10px] text-muted-foreground capitalize">{inv.role}</span>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {isLink && isPending && expiresDate
                            ? `Expires ${format(expiresDate, 'MMM d, h:mm a')}`
                            : `Sent ${sentDate ? formatDistanceToNow(sentDate, { addSuffix: true }) : '—'}${isPending && expiresDate ? ` · expires ${format(expiresDate, 'MMM d')}` : ''}`
                          }
                        </p>
                      </div>
                      {/* Pending link actions */}
                      {isLink && isPending && !isClaimed && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => copyExistingLink(inv.token)}
                            title={t('userManagement.copyLink')}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => shareExistingLink(inv.token)}
                            title={t('userManagement.shareLink')}
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-muted-foreground hover:text-red-500 px-2"
                            onClick={() => handleRevokeLink(inv.id)}
                          >
                            {t('userManagement.revokeLink')}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Invite Bottom Sheet */}
      <BottomSheet open={inviteOpen} onOpenChange={handleCloseSheet} title={t('userManagement.inviteSheetTitle')}>
        <div className="space-y-4">

          {/* Tab switcher */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setInviteTab(INVITE_TAB_LINK)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                inviteTab === INVITE_TAB_LINK
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('userManagement.tabLink')}
            </button>
            <button
              onClick={() => setInviteTab(INVITE_TAB_EMAIL)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                inviteTab === INVITE_TAB_EMAIL
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('userManagement.tabEmail')}
            </button>
          </div>

          {/* ── Share Link tab ────────────────────────────────────────── */}
          {inviteTab === INVITE_TAB_LINK && (
            <>
              {!generatedLink ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">{t('userManagement.linkNameLabel')}</label>
                    <Input
                      placeholder={t('userManagement.linkNamePlaceholder')}
                      value={linkName}
                      onChange={(e) => setLinkName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleGenerateLink()}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{t('userManagement.linkExpiry')}</p>
                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" onClick={handleCloseSheet} className="flex-1">{t('userManagement.cancel')}</Button>
                    <Button onClick={handleGenerateLink} disabled={generatingLink} className="flex-1">
                      {generatingLink ? t('userManagement.generating') : t('userManagement.generateLink')}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">{t('userManagement.linkLabel')}</label>
                    <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg border border-border">
                      <p className="text-xs text-muted-foreground flex-1 break-all font-mono">{generatedLink}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCopyLink} className="flex-1 gap-2">
                      <Copy className="w-4 h-4" />
                      {t('userManagement.copyLink')}
                    </Button>
                    <Button onClick={handleShareLink} className="flex-1 gap-2">
                      <Share2 className="w-4 h-4" />
                      {t('userManagement.shareLink')}
                    </Button>
                  </div>
                  <Button variant="ghost" onClick={handleCloseSheet} className="w-full text-muted-foreground">
                    {t('userManagement.cancel')}
                  </Button>
                </>
              )}
            </>
          )}

          {/* ── Email tab ─────────────────────────────────────────────── */}
          {inviteTab === INVITE_TAB_EMAIL && (
            <>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">{t('userManagement.emailLabel')}</label>
                <Input
                  type="email"
                  placeholder={t('userManagement.emailPlaceholder')}
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailInvite()}
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
                <Button variant="outline" onClick={handleCloseSheet} className="flex-1">{t('userManagement.cancel')}</Button>
                <Button onClick={handleEmailInvite} disabled={inviting || !inviteEmail.trim()} className="flex-1">
                  {inviting ? t('userManagement.sending') : t('userManagement.sendInvitation')}
                </Button>
              </div>
            </>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}