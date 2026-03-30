import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const PENDING_TOKEN_KEY = 'pending_invite_token';

export default function UserNotRegisteredError() {
  const [claimState, setClaimState] = useState('idle'); // idle | claiming | need_email | success | failed
  const [fallbackEmail, setFallbackEmail] = useState('');
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(PENDING_TOKEN_KEY);
    if (token) {
      attemptGoogleClaim(token);
    }
  }, []);

  const attemptGoogleClaim = async (token) => {
    setClaimState('claiming');
    try {
      const result = await base44.functions.invoke('validateInviteToken', {
        action: 'claim_google',
        token,
      });
      if (result.success) {
        localStorage.removeItem(PENDING_TOKEN_KEY);
        setClaimState('success');
        // Brief pause then reload so the auth context re-checks the user
        setTimeout(() => window.location.reload(), 1200);
      } else if (result.reason === 'cannot_determine_email') {
        // Server couldn't get the email from the auth token — ask the user
        setClaimState('need_email');
      } else {
        // Token expired, used, or not found
        localStorage.removeItem(PENDING_TOKEN_KEY);
        setClaimState('failed');
      }
    } catch {
      setClaimState('idle');
    }
  };

  const attemptEmailFallback = async () => {
    if (!fallbackEmail.trim()) return;
    const token = localStorage.getItem(PENDING_TOKEN_KEY);
    if (!token) { setClaimState('failed'); return; }
    setClaiming(true);
    try {
      const result = await base44.functions.invoke('validateInviteToken', {
        action: 'claim_email',
        token,
        email: fallbackEmail.trim(),
      });
      if (result.success) {
        localStorage.removeItem(PENDING_TOKEN_KEY);
        setClaimState('success');
        setTimeout(() => window.location.reload(), 1200);
      } else {
        setClaimState('failed');
      }
    } catch {
      setClaimState('failed');
    } finally {
      setClaiming(false);
    }
  };

  // ── Token claiming in progress ────────────────────────────────────────────
  if (claimState === 'claiming') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-white to-slate-50 px-4">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg border border-slate-100 text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-slate-400 mx-auto" />
          <h1 className="text-xl font-bold text-slate-900">Setting up your account...</h1>
          <p className="text-slate-500 text-sm">Just a moment while we complete your registration.</p>
        </div>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (claimState === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-white to-slate-50 px-4">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg border border-slate-100 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900">You're all set!</h1>
          <p className="text-slate-500 text-sm">Loading the app...</p>
        </div>
      </div>
    );
  }

  // ── Need email fallback (server couldn't determine email from Google token) ─
  if (claimState === 'need_email') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-white to-slate-50 px-4">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg border border-slate-100 space-y-4">
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-900 mb-2">One more step</h1>
            <p className="text-slate-500 text-sm">
              Please enter the email address you used to sign up, so we can complete your account setup.
            </p>
          </div>
          <Input
            type="email"
            placeholder="your@email.com"
            value={fallbackEmail}
            onChange={(e) => setFallbackEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && attemptEmailFallback()}
          />
          <Button
            onClick={attemptEmailFallback}
            disabled={claiming || !fallbackEmail.trim()}
            className="w-full"
          >
            {claiming ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Setting up...</> : 'Complete setup'}
          </Button>
        </div>
      </div>
    );
  }

  // ── Claim failed (token expired or already used after Google sign-in) ──────
  if (claimState === 'failed') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-white to-slate-50 px-4">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg border border-slate-100 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-2 rounded-full bg-orange-100">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Invitation expired or already used</h1>
          <p className="text-slate-600 text-sm">
            The invitation link you used is no longer valid. Please contact the administrator for a new one.
          </p>
        </div>
      </div>
    );
  }

  // ── Default: not registered, no pending token ─────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg border border-slate-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-orange-100">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Access Restricted</h1>
          <p className="text-slate-600 mb-8">
            You are not registered to use this application. Please contact the app administrator to request access.
          </p>
          <div className="p-4 bg-slate-50 rounded-md text-sm text-slate-600">
            <p>If you believe this is an error, you can:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Verify you are logged in with the correct account</li>
              <li>Contact the app administrator for access</li>
              <li>Try logging out and back in again</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
