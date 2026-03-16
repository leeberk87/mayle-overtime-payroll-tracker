import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Save, UserPlus, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    base_salary: 10000,
    transport_allowance: 250,
    overtime_rate: 65,
    employee_role_label: 'Nanny',
    effective_date: format(new Date(), 'yyyy-MM-dd'),
  });
  const [effectiveDateObj, setEffectiveDateObj] = useState(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const queryClient = useQueryClient();

  const { data: settingsList = [] } = useQuery({
    queryKey: ['settings'],
    queryFn: () => base44.entities.AppSettings.list('-effective_date'),
  });

  // Populate form with latest settings
  useEffect(() => {
    if (settingsList.length > 0) {
      const latest = settingsList[0];
      setForm({
        base_salary: latest.base_salary ?? 10000,
        transport_allowance: latest.transport_allowance ?? 250,
        overtime_rate: latest.overtime_rate ?? 65,
        employee_role_label: latest.employee_role_label ?? 'Nanny',
        effective_date: latest.effective_date ?? format(new Date(), 'yyyy-MM-dd'),
      });
      if (latest.effective_date) {
        setEffectiveDateObj(new Date(latest.effective_date));
      }
    }
  }, [settingsList]);

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.AppSettings.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings saved!');
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      ...form,
      base_salary: Number(form.base_salary),
      transport_allowance: Number(form.transport_allowance),
      overtime_rate: Number(form.overtime_rate),
      effective_date: format(effectiveDateObj, 'yyyy-MM-dd'),
    });
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    await base44.users.inviteUser(inviteEmail.trim(), 'nanny');
    toast.success(`Invitation sent to ${inviteEmail}`);
    setInviteEmail('');
    setInviteLoading(false);
  };

  if (!user || user.role !== 'employer') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-500">Access restricted to employers.</p>
      </div>
    );
  }

  const employeeLabel = form.employee_role_label || 'Nanny';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-5 h-5 text-slate-600" />
            <div>
              <h1 className="text-xl font-bold text-slate-900">Settings</h1>
              <p className="text-xs text-slate-500">Manage salary & invite staff</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {/* Salary Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Salary & Rates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Employee Role Label</Label>
              <Input
                value={form.employee_role_label}
                onChange={(e) => setForm({ ...form, employee_role_label: e.target.value })}
                placeholder="e.g. Nanny, Babysitter, Caregiver"
              />
            </div>

            <div className="space-y-1">
              <Label>Base Monthly Salary (₪)</Label>
              <Input
                type="number"
                value={form.base_salary}
                onChange={(e) => setForm({ ...form, base_salary: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label>Monthly Transport Allowance (₪)</Label>
              <Input
                type="number"
                value={form.transport_allowance}
                onChange={(e) => setForm({ ...form, transport_allowance: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label>Hourly Overtime Rate (₪/hr)</Label>
              <Input
                type="number"
                value={form.overtime_rate}
                onChange={(e) => setForm({ ...form, overtime_rate: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label>Effective From</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(effectiveDateObj, 'MMMM d, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={effectiveDateObj}
                    onSelect={(d) => { if (d) { setEffectiveDateObj(d); setCalendarOpen(false); } }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="w-full bg-slate-800 hover:bg-slate-900"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </CardContent>
        </Card>

        {/* Invite Staff */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invite {employeeLabel}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Email Address</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder={`Enter ${employeeLabel.toLowerCase()} email`}
              />
            </div>
            <Button
              onClick={handleInvite}
              disabled={!inviteEmail.trim() || inviteLoading}
              className="w-full"
              variant="outline"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {inviteLoading ? 'Sending...' : `Invite ${employeeLabel}`}
            </Button>
          </CardContent>
        </Card>

        {/* Settings History */}
        {settingsList.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Settings History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {settingsList.map((s, i) => (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        ₪{s.base_salary?.toLocaleString()} base · ₪{s.overtime_rate}/hr OT
                      </p>
                      <p className="text-xs text-slate-400">
                        Effective: {s.effective_date ? format(new Date(s.effective_date), 'MMM d, yyyy') : 'N/A'}
                      </p>
                    </div>
                    {i === 0 && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Current</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}