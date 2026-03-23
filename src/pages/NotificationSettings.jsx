import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, Navigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Bell } from "lucide-react";
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

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Skeleton className="h-32 w-32 rounded-xl" /></div>;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-lg lg:max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/Settings">
            <Button variant="ghost" size="icon" className="text-slate-600"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
            <p className="text-xs text-slate-500">Manage how you receive alerts</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg lg:max-w-2xl mx-auto px-4 py-6">
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-100 rounded-lg"><Bell className="w-4 h-4 text-slate-600" /></div>
              <div>
                <CardTitle className="text-base">Notification Preferences</CardTitle>
                <CardDescription className="text-xs">Choose how you receive alerts</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">Email notifications</p>
                <p className="text-xs text-slate-500">Get emailed on new submissions & reviews</p>
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
                <p className="text-sm font-medium text-slate-800">In-app notifications</p>
                <p className="text-xs text-slate-500">Bell icon alerts inside the app</p>
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