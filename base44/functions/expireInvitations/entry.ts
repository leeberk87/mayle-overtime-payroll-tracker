import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date().toISOString();

    // Get all pending invitations
    const pending = await base44.asServiceRole.entities.Invitation.filter({ status: 'pending' });

    let expiredCount = 0;
    for (const inv of pending) {
      // Email-based invitations use expires_at; link-based ones use token_expires_at
      const expiryDate = inv.token_expires_at || inv.expires_at;
      if (expiryDate && expiryDate < now) {
        await base44.asServiceRole.entities.Invitation.update(inv.id, { status: 'expired' });
        expiredCount++;
      }
    }

    return Response.json({ message: `Expired ${expiredCount} invitation(s)` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});