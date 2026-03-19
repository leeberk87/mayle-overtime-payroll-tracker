import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { entity_type, entity_id, submitter_email, submitter_name, entry_date, entry_type } = await req.json();

    // Get all admins
    const allUsers = await base44.asServiceRole.entities.User.list();
    const admins = allUsers.filter(u => u.role === 'admin');

    const title = `New ${entity_type} Submitted`;
    const message = `${submitter_name} submitted a new ${entry_type} entry for ${entry_date} pending your review.`;

    for (const admin of admins) {
      // Create in-app notification
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: admin.email,
        title,
        message,
        type: 'submission',
        is_read: false,
        related_entity_type: entity_type,
        related_entity_id: entity_id,
      });

      // Send email if admin has email notifications enabled
      if (admin.notification_email !== false) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: admin.email,
          subject: title,
          body: `<p>${message}</p><p>Please log in to review and approve or decline the submission.</p>`,
        });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});