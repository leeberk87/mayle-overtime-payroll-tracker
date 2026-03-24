import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell } from "lucide-react";
import AppHeader from '@/components/AppHeader';
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function NotificationSettings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifInApp, setNotifInApp] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then(u => {
        setUser(u);
        setNotifEmail(u?.notification_email !== false);
        setNotifInApp(u?.notification_in_app !== false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Skeleton className="h-32 w-32 rounded-xl" /></div>;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Notifications" subtitle="Manage how you receive alerts" backPath="/Settings" />

      <div className="max-w-lg lg:max-w-2xl mx-auto px-4 py-6">
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-secondary rounded-lg"><Bell className="w-4 h-4 text-secondary-foreground" /></div>
              <div>
                <CardTitle className="text-base">Notification Preferences</CardTitle>
                <CardDescription className="text-xs">Choose how you receive alerts</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Email notifications</p>
                <p className="text-xs text-muted-foreground">Get emailed on new submissions & reviews</p>
              </div>
              <Switch
                checked={notifEmail}
                onCheckedChange={async (v) => {
                  setNotifEmail(v);
                  await base44.auth.updateMe({ notification_email: v });
                  toast.success('Preference saved');
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">In-app notifications</p>
                <p className="text-xs text-muted-foreground">Bell icon alerts inside the app</p>
              </div>
              <Switch
                checked={notifInApp}
                onCheckedChange={async (v) => {
                  setNotifInApp(v);
                  await base44.auth.updateMe({ notification_in_app: v });
                  toast.success('Preference saved');
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}