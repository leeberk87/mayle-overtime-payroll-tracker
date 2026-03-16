import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, UserPlus, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [baseSalary, setBaseSalary] = useState('');
  const [transport, setTransport] = useState('');
  const [otRate, setOtRate] = useState('');
  const [employeeLabel, setEmployeeLabel] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('nanny');
  const [inviting, setInviting] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: latestSettings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => base44.entities.AppSettings.list('-effective_date', 1).then(r => r[0]),
  });

  useEffect(() => {
    if (latestSettings) {
      setBaseSalary(String(latestSettings.base_salary ?? 10000));
      setTransport(String(latestSettings.transport_allowance ?? 250));
      setOtRate(String(latestSettings.overtime_rate ?? 65));
      setEmployeeLabel(latestSettings.employee_role_label ?? 'Nanny');
    }
  }, [latestSettings]);

  const saveMutation = useMutation({
    mutationFn: () => base44.entities.AppSettings.create({
      base_salary: Number(baseSalary),
      transport_allowance: Number(transport),
      overtime_rate: Number(otRate),
      employee_role_label: employeeLabel.trim() || 'Nanny',
      effective_date: effectiveDate,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings saved!');
    },
  });

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    await base44.users.inviteUser(inviteEmail.trim(), inviteRole);
    toast.success(`Invitation sent to ${inviteEmail}`);
    setInviteEmail('');
    setInviting(false);
  };

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" /> Settings
          </h1>
          <p className="text-xs text-slate-500">Manage salary, rates, and team</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Salary Settings */}
        <Card className="border-slate-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-800">Salary & Rates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Employee Label</Label>
              <Input
                value={employeeLabel}
                onChange={(e) => setEmployeeLabel(e.target.value)}
                placeholder="e.g. Nanny, Babysitter, Caregiver"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Base Salary (₪)</Label>
                <Input type="number" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Transport (₪)</Label>
                <Input type="number" value={transport} onChange={(e) => setTransport(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Overtime Rate (₪/hr)</Label>
              <Input type="number" value={otRate} onChange={(e) => setOtRate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Effective From</Label>
              <Input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
            </div>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="w-full bg-slate-800 hover:bg-slate-900"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </CardContent>
        </Card>

        {/* Invite User */}
        <Card className="border-slate-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-800">Invite Team Member</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Email Address</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Role</Label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="nanny">{employeeLabel || 'Nanny'}</option>
                <option value="employer">Employer</option>
              </select>
            </div>
            <Button
              onClick={handleInvite}
              disabled={inviting || !inviteEmail.trim()}
              className="w-full bg-slate-800 hover:bg-slate-900"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {inviting ? 'Sending...' : 'Send Invitation'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}