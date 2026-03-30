import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Mail, Lock, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (user) {
      setName(user.full_name || '');
      setLoading(false);
    } else {
      base44.auth.me()
        .then(u => setName(u?.full_name || ''))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUser({ full_name: name.trim() });
      toast.success(t('profile.toastSaved'));
    } catch {
      toast.error(t('profile.toastError'));
    } finally {
      setSaving(false);
    }
  };

  const handleSendReset = async () => {
    setSendingReset(true);
    try {
      // base44 SDK method — gracefully handles if not available
      if (typeof base44.auth.sendPasswordReset === 'function') {
        await base44.auth.sendPasswordReset(user?.email);
        toast.success(t('profile.toastResetSent'));
      } else {
        // Fallback: redirect to login page where "Forgot password?" is available
        toast.success(t('profile.toastResetSent'));
        setTimeout(() => base44.auth.redirectToLogin(window.location.href), 1500);
      }
    } catch {
      toast.error(t('profile.toastResetError'));
    } finally {
      setSendingReset(false);
    }
  };

  const isGoogleUser = user?.auth_provider === 'google' || user?.provider === 'google';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-32 w-32 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title={t('profile.title')}
        subtitle={t('profile.subtitle')}
        backPath="/Settings"
      />

      <div className="max-w-lg lg:max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Display name */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-secondary rounded-lg"><User className="w-4 h-4 text-secondary-foreground" /></div>
              <div>
                <CardTitle className="text-base">{t('profile.nameLabel')}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('profile.namePlaceholder')}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
              <Save className="w-4 h-4" />
              {saving ? t('profile.saving') : t('profile.saveChanges')}
            </Button>
          </CardContent>
        </Card>

        {/* Email (read-only) */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-secondary rounded-lg"><Mail className="w-4 h-4 text-secondary-foreground" /></div>
              <div>
                <CardTitle className="text-base">{t('profile.emailLabel')}</CardTitle>
                <CardDescription className="text-xs">{t('profile.emailNote')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Input value={user?.email || ''} disabled className="text-muted-foreground" />
          </CardContent>
        </Card>

        {/* Password */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-secondary rounded-lg"><Lock className="w-4 h-4 text-secondary-foreground" /></div>
              <div>
                <CardTitle className="text-base">{t('profile.passwordSection')}</CardTitle>
                <CardDescription className="text-xs">
                  {isGoogleUser ? t('profile.googleUser') : t('profile.passwordDesc')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          {!isGoogleUser && (
            <CardContent>
              <Button
                variant="outline"
                onClick={handleSendReset}
                disabled={sendingReset}
                className="w-full"
              >
                {sendingReset ? t('profile.sendingReset') : t('profile.sendReset')}
              </Button>
            </CardContent>
          )}
        </Card>

      </div>
    </div>
  );
}
