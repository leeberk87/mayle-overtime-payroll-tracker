import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Navigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Wallet, Bell, Users, ChevronRight, Trash2, Moon } from "lucide-react";
import AppHeader from '@/components/AppHeader';
import { Switch } from "@/components/ui/switch";
import { Link } from 'react-router-dom';
import { useTheme } from "next-themes";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen bg-slate-50 dark:bg-background flex items-center justify-center"><Skeleton className="h-32 w-32 rounded-xl" /></div>;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;

  const sections = [
    { label: 'Salary Settings', description: 'Base salary, transport & overtime rates', icon: Wallet, path: '/SalarySettings' },
    { label: 'Notifications', description: 'Email and in-app alert preferences', icon: Bell, path: '/NotificationSettings' },
    { label: 'User Management', description: 'Invite users, manage roles & access', icon: Users, path: '/UserManagement' },
  ];

  const handleDeleteAccount = async () => {
    await base44.entities.User.delete(user.id);
    base44.auth.logout('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Settings" subtitle="Admin configuration" backPath="/" />

      <div className="max-w-lg lg:max-w-2xl mx-auto px-4 py-6 space-y-3">
        {sections.map(({ label, description, icon: Icon, path }) => (
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

        {/* Appearance */}
        <div className="pt-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Appearance</p>
          <Card className="border-border shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary rounded-lg"><Moon className="w-4 h-4 text-secondary-foreground" /></div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Dark Mode</p>
                  <p className="text-xs text-muted-foreground">Switch between light and dark theme</p>
                </div>
              </div>
              <Switch
                checked={resolvedTheme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
            </CardContent>
          </Card>
        </div>

        {/* Account Deletion */}
        <div className="pt-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Danger Zone</p>
          <Card className="border-red-100 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></div>
                <div>
                  <p className="text-sm font-semibold text-red-700">Delete Account</p>
                  <p className="text-xs text-slate-500">Permanently remove your account and data</p>
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="select-none text-red-500 hover:text-red-700 hover:bg-red-50">Delete</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will <strong>permanently delete</strong> your account and all associated data. This action <strong>cannot be undone</strong>.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="select-none">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} className="select-none bg-red-500 hover:bg-red-600">Yes, delete my account</AlertDialogAction>
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
