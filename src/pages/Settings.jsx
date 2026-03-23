import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, Navigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Wallet, Bell, Users, ChevronRight } from "lucide-react";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Skeleton className="h-32 w-32 rounded-xl" /></div>;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;

  const sections = [
    { label: 'Salary Settings', description: 'Base salary, transport & overtime rates', icon: Wallet, path: '/SalarySettings' },
    { label: 'Notifications', description: 'Email and in-app alert preferences', icon: Bell, path: '/NotificationSettings' },
    { label: 'User Management', description: 'Invite users, manage roles & access', icon: Users, path: '/UserManagement' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-lg lg:max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="text-slate-600"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Settings</h1>
            <p className="text-xs text-slate-500">Admin configuration</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg lg:max-w-2xl mx-auto px-4 py-6 space-y-3">
        {sections.map(({ label, description, icon: Icon, path }) => (
          <Link to={path} key={path}>
            <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg"><Icon className="w-4 h-4 text-slate-600" /></div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{label}</p>
                    <p className="text-xs text-slate-500">{description}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}