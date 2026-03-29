import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Wallet, Bell, Users, ChevronRight, Trash2, Moon, Globe } from "lucide-react";
import AppHeader from '@/components/AppHeader';
import { Switch } from "@/components/ui/switch";
import { Link } from 'react-router-dom';
import { useTheme } from "next-themes";
import { useLanguage } from '@/lib/LanguageContext';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'he', label: 'עברית', flag: '🇮🇱' },
];

export default function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { resolvedTheme, setTheme } = useTheme();
  const { lang, setLanguage, t } = useLanguage();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen bg-slate-50 dark:bg-background flex items-center justify-center"><Skeleton className="h-32 w-32 rounded-xl" /></div>;

  const isAdmin = user?.role === 'admin';

  const adminSections = [
    { label: t('settings.salary'), description: t('settings.salaryDesc'), icon: Wallet, path: '/SalarySettings' },
    { label: t('settings.notifications'), description: t('settings.notificationsDesc'), icon: Bell, path: '/NotificationSettings' },
    { label: t('settings.userManagement'), description: t('settings.userManagementDesc'), icon: Users, path: '/UserManagement' },
  ];

  const handleDeleteAccount = async () => {
    await base44.entities.User.delete(user.id);
    base44.auth.logout('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title={t('settings.title')}
        subtitle={isAdmin ? t('settings.adminSubtitle') : t('settings.userSubtitle')}
        backPath="/"
      />

      <div className="max-w-lg lg:max-w-2xl mx-auto px-4 py-6 space-y-3">

        {/* Admin-only sections */}
        {isAdmin && adminSections.map(({ label, description, icon: Icon, path }) => (
          <Link to={path} key={path}>
            <Card className="border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary rounded-lg"><Icon className="w-4 h-4 text-secondary-foreground" /></div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}

        {/* Appearance — visible to all */}
        <div className={isAdmin ? 'pt-4' : ''}>
          {isAdmin && <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{t('settings.appearance')}</p>}
          <Card className="border-border shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary rounded-lg"><Moon className="w-4 h-4 text-secondary-foreground" /></div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t('settings.darkMode')}</p>
                  <p className="text-xs text-muted-foreground">{t('settings.darkModeDesc')}</p>
                </div>
              </div>
              <Switch
                checked={resolvedTheme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
            </CardContent>
          </Card>
        </div>

        {/* Language selector — visible to all */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-secondary rounded-lg"><Globe className="w-4 h-4 text-secondary-foreground" /></div>
              <div>
                <p className="text-sm font-semibold text-foreground">{t('settings.language')}</p>
                <p className="text-xs text-muted-foreground">{t('settings.languageDesc')}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {LANGUAGES.map(({ code, label, flag }) => (
                <button
                  key={code}
                  onClick={() => setLanguage(code)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl border text-xs font-medium transition-colors ${
                    lang === code
                      ? 'border-foreground bg-secondary text-foreground'
                      : 'border-border text-muted-foreground hover:border-foreground/40'
                  }`}
                >
                  <span className="text-lg">{flag}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Account Deletion — visible to all */}
        <div className="pt-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{t('settings.dangerZone')}</p>
          <Card className="border-red-100 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></div>
                <div>
                  <p className="text-sm font-semibold text-red-700">{t('settings.deleteAccount')}</p>
                  <p className="text-xs text-slate-500">{t('settings.deleteAccountDesc')}</p>
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="select-none text-red-500 hover:text-red-700 hover:bg-red-50">{t('settings.delete')}</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('settings.deleteTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('settings.deleteBody')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="select-none">{t('settings.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} className="select-none bg-red-500 hover:bg-red-600">{t('settings.confirmDelete')}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
