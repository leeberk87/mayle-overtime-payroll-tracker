import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Save, Wallet, Car, Clock, Info, UserPlus, User, Tag } from "lucide-react";
import { toast } from "sonner";
import { format } from 'date-fns';

export default function Settings() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [baseSalary, setBaseSalary] = useState(10000);
  const [transport, setTransport] = useState(250);
  const [overtimeRate, setOvertimeRate] = useState(65);
  const [employeeLabel, setEmployeeLabel] = useState('Nanny');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('nanny');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => base44.entities.AppSettings.list('-effective_date'),
  });

  const latestSettings = settingsData?.[0];

  useEffect(() => {
    if (latestSettings) {
      setBaseSalary(latestSettings.base_salary || 10000);
      setTransport(latestSettings.transport_allowance || 250);
      setOvertimeRate(latestSettings.overtime_rate || 65);
      setEmployeeLabel(latestSettings.employee_role_label || 'Nanny');
    }
  }, [latestSettings]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      // Always create a new record with today as effective_date for historical tracking
      return base44.entities.AppSettings.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings saved! Changes apply from today onwards.');
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      base_salary: Number(baseSalary),
      transport_allowance: Number(transport),
      overtime_rate: Number(overtimeRate),
      employee_role_label: employeeLabel.trim() || 'Nanny',
      effective_date: format(new Date(), 'yyyy-MM-dd'),
    });
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await base44.users.inviteUser(inviteEmail.trim(), inviteRole);
      toast.success(`Invitation sent to ${inviteEmail}!`);
      setInviteEmail('');
    } catch (e) {
      toast.error('Failed to send invitation. Please try again.');
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Skeleton className="h-32 w-32 rounded-xl" />
      </div>
    );
  }

  if (user?.role !== 'employer') {
    return <Navigate to="/Home" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link to="/Home">
              <Button variant="ghost" size="icon" className="text-slate-600">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Settings</h1>
              <p className="text-xs text-slate-500">Manage salary constants & team</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Saving creates a new version effective from today. Past calculations remain unchanged.
              </p>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
          </div>
        ) : (
          <>
            {/* Employee Role Label */}
            <Card className="border-slate-100 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Tag className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Employee Position Label</CardTitle>
                    <CardDescription className="text-xs">
                      Used throughout the app (e.g. Nanny, Babysitter, Caregiver)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Input
                  value={employeeLabel}
                  onChange={(e) => setEmployeeLabel(e.target.value)}
                  placeholder="e.g. Nanny, Babysitter, Caregiver"
                  className="text-base"
                />
              </CardContent>
            </Card>

            {/* Base Salary */}
            <Card className="border-slate-100 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Wallet className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Base Salary</CardTitle>
                    <CardDescription className="text-xs">Fixed monthly salary before overtime</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₪</span>
                  <Input type="number" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} className="pl-8 text-lg font-semibold" />
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
                    <CardDescription className="text-xs">Monthly travel/commute allowance</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₪</span>
                  <Input type="number" value={transport} onChange={(e) => setTransport(e.target.value)} className="pl-8 text-lg font-semibold" />
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
                    <CardDescription className="text-xs">Hourly rate for overtime hours</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₪</span>
                  <Input type="number" value={overtimeRate} onChange={(e) => setOvertimeRate(e.target.value)} className="pl-8 text-lg font-semibold" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">/hr</span>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button onClick={handleSave} disabled={saveMutation.isPending} className="w-full bg-slate-800 hover:bg-slate-900 py-6 text-base shadow-lg">
              <Save className="w-5 h-5 mr-2" />
              {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>

            {/* Invite Users */}
            <Card className="border-slate-100 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <UserPlus className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Invite Team Member</CardTitle>
                    <CardDescription className="text-xs">
                      Invite a {employeeLabel || 'Nanny'} or a co-employer (e.g. co-parent)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-sm text-slate-600">Email Address</Label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="person@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-slate-600">Role</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setInviteRole('nanny')}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
                        inviteRole === 'nanny'
                          ? 'bg-slate-800 text-white border-slate-800'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      {employeeLabel || 'Nanny'}
                    </button>
                    <button
                      onClick={() => setInviteRole('employer')}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
                        inviteRole === 'employer'
                          ? 'bg-slate-800 text-white border-slate-800'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      Employer
                    </button>
                  </div>
                </div>
                <Button
                  onClick={handleInvite}
                  disabled={!inviteEmail.trim() || inviting}
                  className="w-full"
                  variant="outline"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {inviting ? 'Sending...' : 'Send Invitation'}
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}