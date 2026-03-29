import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// Inline translations for email notifications — keeps the function self-contained
const tr = {
  en: {
    subject: (type: string) => `New ${type} Submitted`,
    body: (name: string, type: string, date: string) =>
      `${name} submitted a new ${type} entry for ${date} pending your review.`,
    cta: 'Please log in to review and approve or decline the submission.',
    overtime: 'overtime',
    expense: 'expense',
  },
  es: {
    subject: (type: string) => `Nueva ${type} Enviada`,
    body: (name: string, type: string, date: string) =>
      `${name} envió una nueva entrada de ${type} para el ${date} pendiente de revisión.`,
    cta: 'Por favor, inicia sesión para revisar y aprobar o rechazar el envío.',
    overtime: 'horas extra',
    expense: 'gasto',
  },
  he: {
    subject: (type: string) => `הוגשה ${type} חדשה`,
    body: (name: string, type: string, date: string) =>
      `${name} הגיש/ה רשומת ${type} חדשה לתאריך ${date} הממתינה לסקירה.`,
    cta: 'אנא התחבר כדי לסקור ולאשר או לדחות את ההגשה.',
    overtime: 'שעות נוספות',
    expense: 'הוצאה',
  },
};

function getLang(user: any): 'en' | 'es' | 'he' {
  const lang = user?.language;
  return (lang === 'es' || lang === 'he') ? lang : 'en';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { entity_type, entity_id, submitter_email, submitter_name, entry_date, entry_type } = await req.json();

    // Get all admins
    const allUsers = await base44.asServiceRole.entities.User.list();
    const admins = allUsers.filter((u: any) => u.role === 'admin');

    for (const admin of admins) {
      const lang = getLang(admin);
      const strings = tr[lang];
      const localType = entry_type === 'overtime' ? strings.overtime : strings.expense;
      const title = strings.subject(localType);
      const message = strings.body(submitter_name, localType, entry_date);

      // Create in-app notification (always in admin's language)
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
          body: `<p>${message}</p><p>${strings.cta}</p>`,
        });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
