import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { submitted_by, status, entity_type, entity_id, entry_date, review_notes } = await req.json();

    const isApproved = status === 'approved';
    const title = `Your ${entity_type} was ${isApproved ? 'Approved ✅' : 'Declined ❌'}`;
    const message = review_notes
      ? `Your ${entity_type} entry for ${entry_date} was ${status}. Admin note: "${review_notes}"`
      : `Your ${entity_type} entry for ${entry_date} was ${status}.`;

    // In-app notification for the submitter
    await base44.asServiceRole.entities.Notification.create({
      recipient_email: submitted_by,
      title,
      message,
      type: isApproved ? 'approval' : 'decline',
      is_read: false,
      related_entity_type: entity_type,
      related_entity_id: entity_id,
    });

    // Email notification if user has it enabled
    const allUsers = await base44.asServiceRole.entities.User.list();
    const submitter = allUsers.find(u => u.email === submitted_by);
    if (submitter && submitter.notification_email !== false) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: submitted_by,
        subject: title,
        body: `<p>${message}</p>`,
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});