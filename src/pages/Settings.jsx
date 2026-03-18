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
import { ArrowLeft, Save, Wallet, Car, Clock, Info } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [baseSalary, setBaseSalary] = useState(10000);
  const [transport, setTransport] = useState(250);
  const [overtimeRate, setOvertimeRate] = useState(65);

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => base44.entities.AppSettings.list(),
  });

  const existingSettings = settingsData?.[0];

  useEffect(() => {
    if (existingSettings) {
      setBaseSalary(existingSettings.base_salary || 10000);
      setTransport(existingSettings.transport_allowance || 250);
      setOvertimeRate(existingSettings.overtime_rate || 65);
    }
  }, [existingSettings]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (existingSettings) {
        return base44.entities.AppSettings.update(existingSettings.id, data);
      } else {
        return base44.entities.AppSettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings saved successfully!');
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      base_salary: Number(baseSalary),
      transport_allowance: Number(transport),
      overtime_rate: Number(overtimeRate)
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
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

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                These values are used to calculate your monthly salary summary. 
                Changes will apply to all months.
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