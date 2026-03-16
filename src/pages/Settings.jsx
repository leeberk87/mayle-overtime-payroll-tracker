import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft, Save, Plus } from 'lucide-react';

export default function Settings() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: settingsList = [], isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => base44.entities.AppSettings.list('-effective_date'),
  });

  const [form, setForm] = useState({
    base_salary: '',
    transport_allowance: '',
    overtime_rate: '',
    employee_role_label: '',
    effective_date: format(new Date(), 'yyyy-MM-dd'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AppSettings.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings saved!');
      setForm({ base_salary: '', transport_allowance: '', overtime_rate: '', employee_role_label: '', effective_date: format(new Date(), 'yyyy-MM-dd') });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AppSettings.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings entry deleted.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      base_salary: parseFloat(form.base_salary),
      transport_allowance: parseFloat(form.transport_allowance),
      overtime_rate: parseFloat(form.overtime_rate),
      employee_role_label: form.employee_role_label || 'Nanny',
      effective_date: form.effective_date,
    });
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Access denied.</p>
      </div>
    );
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
              <p className="text-xs text-slate-500">Manage salary rates</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Add new settings entry */}
        <Card>
          <CardHeader className="pb-2">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Rate Entry
            </h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Base Salary (₪)</Label>
                  <Input
                    type="number"
                    value={form.base_salary}
                    onChange={e => setForm({ ...form, base_salary: e.target.value })}
                    placeholder="e.g. 10000"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Transport (₪)</Label>
                  <Input
                    type="number"
                    value={form.transport_allowance}
                    onChange={e => setForm({ ...form, transport_allowance: e.target.value })}
                    placeholder="e.g. 250"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">OT Rate (₪/hr)</Label>
                  <Input
                    type="number"
                    value={form.overtime_rate}
                    onChange={e => setForm({ ...form, overtime_rate: e.target.value })}
                    placeholder="e.g. 65"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Employee Label</Label>
                  <Input
                    type="text"
                    value={form.employee_role_label}
                    onChange={e => setForm({ ...form, employee_role_label: e.target.value })}
                    placeholder="e.g. Nanny"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Effective From</Label>
                <Input
                  type="date"
                  value={form.effective_date}
                  onChange={e => setForm({ ...form, effective_date: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 gap-2" disabled={createMutation.isPending}>
                <Save className="w-4 h-4" />
                {createMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Existing settings history */}
        {settingsList.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">Rate History</h2>
            <div className="space-y-3">
              {settingsList.map((s, i) => (
                <Card key={s.id} className={i === 0 ? 'border-slate-800' : ''}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        {i === 0 && <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Current</span>}
                        <p className="text-xs text-slate-500">Effective: {s.effective_date || 'Always'}</p>
                        <div className="flex gap-3 text-sm text-slate-700 mt-1">
                          <span>₪{s.base_salary?.toLocaleString()} base</span>
                          <span>·</span>
                          <span>₪{s.transport_allowance} transport</span>
                          <span>·</span>
                          <span>₪{s.overtime_rate}/hr OT</span>
                        </div>
                        {s.employee_role_label && (
                          <p className="text-xs text-slate-400">Label: {s.employee_role_label}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 text-xs"
                        onClick={() => deleteMutation.mutate(s.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}