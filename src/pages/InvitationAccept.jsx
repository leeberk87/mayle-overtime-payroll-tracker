import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Mail, CheckCircle, Loader2 } from 'lucide-react';

export const PENDING_TOKEN_KEY = 'pending_invite_token';

export default function InvitationAccept() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  // Name is passed as a URL param — cosmetic only, used for the "Hi Maya," greeting
  const nameFromUrl = searchParams.get('name') || null;

  const [state, setState] = useState('loading'); // loading | valid | invalid | email_sent | google_redirect
  const [inviteData, setInviteData] = useState(null);
  const [invalidReason, setInvalidReason] = useState(null);
  const [email, setEmail] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState(null);

  useEffect(() => {
    if (!token) {
      setInvalidReason('not_found');
      setState('invalid');
      return;
    }
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const result = await base44.functions.invoke('validateInviteToken', { action: 'validate', token });
      if (result.valid) {
        setInviteData(result);
        setState('valid');
      } else {
        setInvalidReason(result.reason || 'not_found');
        setState('invalid');
      }
    } catch {
      setInvalidReason('not_found');
      setState('invalid');
    }
  };

  const handleEmailJoin = async () => {
    if (!email.trim()) return;
    setJoining(true);
    setJoinError(null);
    try {
      const result = await base44.functions.invoke('validateInviteToken', {
        action: 'claim_email',
        token,
        email: email.trim(),
      });
      if (result.success) {
        setState('email_sent');
      } else {
        setJoinError('Something went wrong. Please try again.');
      }
    } catch {
      setJoinError('Something went wrong. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  const handleGoogleJoin = () => {
    // Save token to localStorage so UserNotRegisteredError can complete registration after OAuth
    localStorage.setItem(PENDING_TOKEN_KEY, token);
    setState('google_redirect');
    setTimeout(() => {
      base44.auth.redirectToLogin(window.location.origin);
    }, 700);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm">Loading invitation...</p>
        </div>
      </div>
    );
  }

  // ── Invalid / expired / used ──────────────────────────────────────────────
  if (state === 'invalid') {
    const reasonText = {
      expired: 'This invitation link has expired.',
      used: 'This invitation link has already been used.',
      not_found: 'This invitation link was not found.',
    }[invalidReason] || 'This invitation link is not valid.';

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mx-auto">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Invitation not valid</h1>
          <p className="text-slate-500 text-sm">{reasonText}</p>
          <p className="text-slate-400 text-sm">Please ask for a new invitation link.</p>
        </div>
      </div>
    );
  }

  // ── Email sent confirmation ───────────────────────────────────────────────
  if (state === 'email_sent') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 mx-auto">
            <CheckCircle className="w-7 h-7 text-emerald-600" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Check your email</h1>
          <p className="text-slate-500 text-sm">
            We sent a sign-up link to <strong className="text-slate-700">{email}</strong>.
            Follow it to create your password and access the app.
          </p>
        </div>
      </div>
    );
  }

  // ── Google redirect in progress ───────────────────────────────────────────
  if (state === 'google_redirect') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto" />
          <h1 className="text-xl font-semibold text-slate-900">Redirecting to sign up...</h1>
          <p className="text-slate-500 text-sm">
            You'll be asked to sign in or create an account with Google.
          </p>
        </div>
      </div>
    );
  }

  // ── Valid invitation landing page ─────────────────────────────────────────
  const { display_name } = inviteData || {};
  // invited_name comes from the URL ?name= param (set by admin when generating the link)
  const invited_name = nameFromUrl;
  const avatarLetter = display_name ? display_name.trim().charAt(0).toUpperCase() : '?';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4">
      <div className="max-w-sm w-full space-y-6">

        {/* Identity / branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 text-white text-2xl font-bold mx-auto shadow-sm">
            {avatarLetter}
          </div>
          {invited_name && (
            <p className="text-slate-500 text-sm">Hi {invited_name},</p>
          )}
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">
            {display_name
              ? `${display_name} has invited you`
              : 'You have been invited'}
          </h1>
          <p className="text-slate-500 text-sm">
            Create your account to start tracking your work hours.
          </p>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">

          {/* Google */}
          <Button
            onClick={handleGoogleJoin}
            variant="outline"
            className="w-full gap-2 h-11 border-slate-200 hover:border-slate-400"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </Button>

          {/* Email flow */}
          {!showEmailForm ? (
            <Button
              onClick={() => setShowEmailForm(true)}
              variant="outline"
              className="w-full gap-2 h-11 border-slate-200 hover:border-slate-400"
            >
              <Mail className="w-4 h-4" />
              Continue with Email
            </Button>
          ) : (
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setJoinError(null); }}
                onKeyDown={(e) => e.key === 'Enter' && handleEmailJoin()}
                autoFocus
                className="h-11"
              />
              {joinError && (
                <p className="text-xs text-red-500">{joinError}</p>
              )}
              <Button
                onClick={handleEmailJoin}
                disabled={joining || !email.trim()}
                className="w-full h-11"
              >
                {joining ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Joining...</>
                ) : (
                  'Join'
                )}
              </Button>
              <button
                onClick={() => { setShowEmailForm(false); setJoinError(null); }}
                className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors py-1"
              >
                Back
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400">
          This invitation expires in 48 hours and can only be used once.
        </p>
      </div>
    </div>
  );
}
