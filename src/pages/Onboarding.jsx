import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function Onboarding({ user, onComplete }) {
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!orgName.trim()) return;
    setLoading(true);
    try {
      const org = await base44.entities.Organization.create({ name: orgName });
      await base44.auth.updateMe({ organization_id: org.id, role: 'admin' });
      toast.success('Organization created!');
      onComplete();
    } catch (e) {
      toast.error('Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50 dark:bg-background p-4">
      <div className="max-w-md w-full bg-card p-8 rounded-2xl border shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Welcome to Work Tracker!</h1>
          <p className="text-muted-foreground text-sm">Let's set up your account by creating an organization for your team.</p>
        </div>
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">Organization Name</label>
          <Input 
            value={orgName} 
            onChange={e => setOrgName(e.target.value)} 
            placeholder="e.g. Acme Corp" 
            className="h-12"
          />
        </div>
        <Button 
          className="w-full h-12 text-base" 
          onClick={handleCreate} 
          disabled={loading || !orgName.trim()}
        >
          {loading ? 'Creating...' : 'Create Organization'}
        </Button>
      </div>
    </div>
  );
}