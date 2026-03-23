import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Save, Wallet, Car, Clock, Info, Bell, Users, ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function Settings() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [baseSalary, setBaseSalary] = useState(10000);
  const [transport, setTransport] = useState(250);
  const [overtimeRate, setOvertimeRate] = useState(65);
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

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => base44.entities.AppSettings.list('-effective_from'),
  });

  // Most recent settings = current defaults shown in the form
  const latestSettings = settingsData?.[0];

  useEffect(() => {
    if (latestSettings) {
      setBaseSalary(latestSettings.base_salary || 10000);
      setTransport(latestSettings.transport_allowance || 250);
      setOvertimeRate(latestSettings.overtime_rate || 65);
    }
  }, [latestSettings]);

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      // Check if a record for this month already exists — update it, otherwise create new
      const thisMonthRecord = settingsData?.find(s => s.effective_from === currentMonth);
      if (thisMonthRecord) {
        return base44.entities.AppSettings.update(thisMonthRecord.id, data);
      }
      return base44.entities.AppSettings.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings saved! Future months will use these rates.');
    },
    onError: () => {
      toast.error('Failed to save settings. Please try again.');
    },
  });

  const handleSave = () => {
    const salary = Number(baseSalary);
    const trans = Number(transport);
    const rate = Number(overtimeRate);

    if (!salary || salary < 1000 || salary > 100000) {
      toast.error('Base salary must be between ₪1,000 and ₪100,000');
      return;
    }
    if (trans < 0 || trans > 5000) {
      toast.error('Transport allowance must be between ₪0 and ₪5,000');
      return;
    }
    if (!rate || rate < 1 || rate > 500) {
      toast.error('Overtime rate must be between ₪1 and ₪500 per hour');
      return;
    }

    saveMutation.mutate({
      effective_from: currentMonth,
      base_salary: salary,
      transport_allowance: trans,
      overtime_rate: rate,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Skeleton className="h-32 w-32 rounded-xl" />
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-lg lg:max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="text-slate-600">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Settings</h1>
              <p className="text-xs text-slate-500">Configure salary constants</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg lg:max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Changes apply from the current month onwards. Previous months will keep their original rates.
              </p>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : (
          <>
            {/* Base Salary */}
            <Card className="border-slate-100 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Wallet className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Base Salary</CardTitle>
                    <CardDescription className="text-xs">
                      Fixed monthly salary before overtime
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₪</span>
                  <Input
                    type="number"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(e.target.value)}
                    className="pl-8 text-lg font-semibold"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Transport Allowance */}
            <Card className="border-slate-100 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Car className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Transport Allowance</CardTitle>
                    <CardDescription className="text-xs">
                      Monthly travel/commute allowance
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₪</span>
                  <Input
                    type="number"
                    value={transport}
                    onChange={(e) => setTransport(e.target.value)}
                    className="pl-8 text-lg font-semibold"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Overtime Rate */}
            <Card className="border-slate-100 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Clock className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Overtime Rate</CardTitle>
                    <CardDescription className="text-xs">
                      Hourly rate for overtime hours
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₪</span>
                  <Input
                    type="number"
                    value={overtimeRate}
                    onChange={(e) => setOvertimeRate(e.target.value)}
                    className="pl-8 text-lg font-semibold"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">/hr</span>
                </div>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card className="border-slate-100 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Bell className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Notifications</CardTitle>
                    <CardDescription className="text-xs">How you receive alerts</CardDescription>
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

            {/* User Management */}
            <Link to="/UserManagement">
              <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <Users className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">User Management</p>
                      <p className="text-xs text-slate-500">Invite users, manage roles & access</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </CardContent>
              </Card>
            </Link>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="w-full bg-slate-800 hover:bg-slate-900 py-6 text-base shadow-lg"
            >
              <Save className="w-5 h-5 mr-2" />
              {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}