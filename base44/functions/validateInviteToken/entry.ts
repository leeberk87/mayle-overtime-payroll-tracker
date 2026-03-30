import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// All base44 functions are called via POST. We use an `action` field to differentiate:
//   { action: 'validate', token }             → check token validity + return display info (public)
//   { action: 'claim_email', token, email }   → email flow: call inviteUser, mark claimed
//   { action: 'claim_google', token }         → Google flow: get identity from auth, create User, mark claimed

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, token, email } = body;

    if (!token) {
      return Response.json({ success: false, reason: 'no_token' }, { status: 400 });
    }

    // ── Helper: look up invitation by token ──────────────────────────────────
    const invitations = await base44.asServiceRole.entities.Invitation.filter({ token });
    const invitation = invitations[0];

    if (!invitation) {
      return Response.json({ valid: false, success: false, reason: 'not_found' });
    }

    const now = new Date().toISOString();
    const expiryDate = invitation.token_expires_at || invitation.expires_at;

    // ── VALIDATE: public token check ─────────────────────────────────────────
    if (action === 'validate') {
      if (invitation.claimed_at) {
        return Response.json({ valid: false, reason: 'used' });
      }
      if (expiryDate && expiryDate < now) {
        return Response.json({ valid: false, reason: 'expired' });
      }

      // Resolve display name: account_name → admin full_name → admin email
      let displayName = null;
      try {
        const settings = await base44.asServiceRole.entities.AppSettings.list('-effective_from');
        displayName = settings?.[0]?.account_name || null;
      } catch { /* settings may not exist yet */ }

      if (!displayName && invitation.invited_by) {
        try {
          const adminUsers = await base44.asServiceRole.entities.User.filter({ email: invitation.invited_by });
          displayName = adminUsers?.[0]?.full_name || invitation.invited_by;
        } catch {
          displayName = invitation.invited_by;
        }
      }

      return Response.json({
        valid: true,
        display_name: displayName,
        invited_name: invitation.invited_name || null,
        role: invitation.role,
      });
    }

    // ── Shared guard for claim actions ───────────────────────────────────────
    if (invitation.claimed_at) {
      return Response.json({ success: false, reason: 'used' }, { status: 400 });
    }
    if (expiryDate && expiryDate < now) {
      return Response.json({ success: false, reason: 'expired' }, { status: 400 });
    }

    const role = invitation.role || 'user';

    // ── CLAIM_EMAIL: employee enters their email on the landing page ──────────
    if (action === 'claim_email') {
      if (!email) {
        return Response.json({ success: false, reason: 'no_email' }, { status: 400 });
      }
      // Send base44 platform invitation (triggers registration email)
      await base44.asServiceRole.users.inviteUser(email, role);
      await base44.asServiceRole.entities.Invitation.update(invitation.id, {
        claimed_at: now,
        claimed_by_email: email,
        status: 'accepted',
      });
      return Response.json({ success: true, mode: 'email' });
    }

    // ── CLAIM_GOOGLE: employee authenticated via Google OAuth ─────────────────
    // The employee has a valid base44 auth token but is not yet in our User entity.
    // We try to get their email from the auth layer, then create the User entity.
    if (action === 'claim_google') {
      let userEmail = null;

      try {
        const me = await base44.auth.me();
        userEmail = me?.email;
      } catch {
        // base44.auth.me() may fail if user is not registered in our app entity.
        // In that case we cannot determine their email server-side.
      }

      if (!userEmail) {
        // Signal to the client that it should retry supplying the email manually
        return Response.json({ success: false, reason: 'cannot_determine_email' });
      }

      // Create User entity so the person can access the app
      try {
        await base44.asServiceRole.entities.User.create({ email: userEmail, role });
      } catch {
        // User entity may have been auto-created by base44; that's fine
      }

      await base44.asServiceRole.entities.Invitation.update(invitation.id, {
        claimed_at: now,
        claimed_by_email: userEmail,
        status: 'accepted',
      });

      return Response.json({ success: true, mode: 'google' });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
