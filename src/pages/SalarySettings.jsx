import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Save, Wallet, Car, Clock, Info, Home } from "lucide-react";
import AppHeader from '@/components/AppHeader';
import { toast } from "sonner";
import { useLanguage } from '@/lib/LanguageContext';

export default function SalarySettings() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accountName, setAccountName] = useState('');
  const [baseSalary, setBaseSalary] = useState(10000);
  const [transport, setTransport] = useState(250);
  const [overtimeRate, setOvertimeRate] = useState(65);
  const { t } = useLanguage();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => base44.entities.AppSettings.list('-effective_from'),
  });

  const latestSettings = settingsData?.[0];

  useEffect(() => {
    if (latestSettings) {
      setAccountName(latestSettings.account_name || '');
      setBaseSalary(latestSettings.base_salary || 10000);
      setTransport(latestSettings.transport_allowance || 250);
      setOvertimeRate(latestSettings.overtime_rate || 65);
    }
  }, [latestSettings]);

  const currentMonth = new Date().toISOString().slice(0, 7);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const thisMonthRecord = settingsData?.find(s => s.effective_from === currentMonth);
      if (thisMonthRecord) return base44.entities.AppSettings.update(thisMonthRecord.id, data);
      return base44.entities.AppSettings.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success(t('salary.toastSaved'));
    },
    onError: () => toast.error(t('salary.toastError')),
  });

  const handleSave = () => {
    const salary = Number(baseSalary);
    const trans = Number(transport);
    const rate = Number(overtimeRate);
    if (!salary || salary < 1000 || salary > 100000) { toast.error(t('salary.errorBaseSalary')); return; }
    if (trans < 0 || trans > 5000) { toast.error(t('salary.errorTransport')); return; }
    if (!rate || rate < 1 || rate > 500) { toast.error(t('salary.errorOvertimeRate')); return; }
    saveMutation.mutate({ effective_from: currentMonth, account_name: accountName.trim(), base_salary: salary, transport_allowance: trans, overtime_rate: rate });
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Skeleton className="h-32 w-32 rounded-xl" /></div>;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title={t('salary.title')} subtitle={t('salary.subtitle')} backPath="/Settings" />

      <div className="max-w-lg lg:max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-secondary rounded-lg"><Home className="w-4 h-4 text-secondary-foreground" /></div>
              <div>
                <CardTitle className="text-base">{t('salary.accountNameLabel')}</CardTitle>
                <CardDescription className="text-xs">{t('salary.accountNameDesc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder={t('salary.accountNamePlaceholder')}
              className="text-base"
            />
          </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/50">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800 dark:text-blue-300">{t('salary.infoNote')}</p>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
          </div>
        ) : (
          <>
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-secondary rounded-lg"><Wallet className="w-4 h-4 text-secondary-foreground" /></div>
                  <div>
                    <CardTitle className="text-base">{t('salary.baseSalary')}</CardTitle>
                    <CardDescription className="text-xs">{t('salary.baseSalaryDesc')}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₪</span>
                  <Input type="number" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} className="pl-8 text-lg font-semibold" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-secondary rounded-lg"><Car className="w-4 h-4 text-secondary-foreground" /></div>
                  <div>
                    <CardTitle className="text-base">{t('salary.transport')}</CardTitle>
                    <CardDescription className="text-xs">{t('salary.transportDesc')}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₪</span>
                  <Input type="number" value={transport} onChange={(e) => setTransport(e.target.value)} className="pl-8 text-lg font-semibold" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-secondary rounded-lg"><Clock className="w-4 h-4 text-secondary-foreground" /></div>
                  <div>
                    <CardTitle className="text-base">{t('salary.overtimeRate')}</CardTitle>
                    <CardDescription className="text-xs">{t('salary.overtimeRateDesc')}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₪</span>
                  <Input type="number" value={overtimeRate} onChange={(e) => setOvertimeRate(e.target.value)} className="pl-8 text-lg font-semibold" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{t('salary.perHour')}</span>
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleSave} disabled={saveMutation.isPending} className="w-full py-6 text-base shadow-lg">
              <Save className="w-5 h-5 mr-2" />
              {saveMutation.isPending ? t('salary.saving') : t('salary.save')}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
