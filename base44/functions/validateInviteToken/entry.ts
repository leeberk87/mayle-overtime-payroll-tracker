import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// Link-based invitations store the token UUID in the `email` field of the Invitation entity.
// This avoids needing new entity fields — we reuse existing ones:
//   email       → token UUID (no @ sign, distinguishable from real emails)
//   expires_at  → 48h token expiry
//   status      → 'pending' → 'accepted' (when claimed)
//   invited_by  → admin email (for display name fallback)
//
// All calls use POST with an `action` field:
//   { action: 'validate', token }             → check token + return display info (public)
//   { action: 'claim_email', token, email }   → email flow: call inviteUser, mark accepted
//   { action: 'claim_google', token }         → google flow: get identity from auth, mark accepted

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, token, email } = body;

    if (!token) {
      return Response.json({ success: false, reason: 'no_token' }, { status: 400 });
    }

    // ── Look up invitation by token (stored in email field) ──────────────────
    const invitations = await base44.asServiceRole.entities.Invitation.filter({ email: token });
    const invitation = invitations[0];

    if (!invitation) {
      return Response.json({ valid: false, success: false, reason: 'not_found' });
    }

    const now = new Date().toISOString();

    // ── VALIDATE: public token check ─────────────────────────────────────────
    if (action === 'validate') {
      if (invitation.status === 'accepted') {
        return Response.json({ valid: false, reason: 'used' });
      }
      if (invitation.expires_at && invitation.expires_at < now) {
        return Response.json({ valid: false, reason: 'expired' });
      }

      // Resolve display name: account_name in settings → admin full_name → admin email
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
        role: invitation.role,
      });
    }

    // ── Shared guard for claim actions ───────────────────────────────────────
    if (invitation.status === 'accepted') {
      return Response.json({ success: false, reason: 'used' }, { status: 400 });
    }
    if (invitation.expires_at && invitation.expires_at < now) {
      return Response.json({ success: false, reason: 'expired' }, { status: 400 });
    }

    const role = invitation.role || 'user';

    // ── CLAIM_EMAIL: employee enters their email on the landing page ──────────
    if (action === 'claim_email') {
      if (!email) {
        return Response.json({ success: false, reason: 'no_email' }, { status: 400 });
      }
      // Trigger base44 platform registration email
      await base44.asServiceRole.users.inviteUser(email, role);
      
      try {
        const existing = await base44.asServiceRole.entities.User.filter({ email });
        if (existing.length > 0) {
          await base44.asServiceRole.entities.User.update(existing[0].id, { organization_id: invitation.organization_id, role });
        } else {
          await base44.asServiceRole.entities.User.create({ email, role, organization_id: invitation.organization_id });
        }
      } catch (e) {
        console.error(e);
      }

      await base44.asServiceRole.entities.Invitation.update(invitation.id, {
        status: 'accepted',
      });
      return Response.json({ success: true, mode: 'email' });
    }

    // ── CLAIM_GOOGLE: employee authenticated via Google OAuth ─────────────────
    if (action === 'claim_google') {
      let userEmail = null;

      try {
        const me = await base44.auth.me();
        userEmail = me?.email;
      } catch {
        // base44.auth.me() may fail if user is not yet in our User entity
      }

      if (!userEmail) {
        return Response.json({ success: false, reason: 'cannot_determine_email' });
      }

      try {
        const existing = await base44.asServiceRole.entities.User.filter({ email: userEmail });
        if (existing.length > 0) {
          await base44.asServiceRole.entities.User.update(existing[0].id, { organization_id: invitation.organization_id, role });
        } else {
          await base44.asServiceRole.entities.User.create({ email: userEmail, role, organization_id: invitation.organization_id });
        }
      } catch {
        // User entity may have been auto-created by base44
      }

      await base44.asServiceRole.entities.Invitation.update(invitation.id, {
        status: 'accepted',
      });

      return Response.json({ success: true, mode: 'google' });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});