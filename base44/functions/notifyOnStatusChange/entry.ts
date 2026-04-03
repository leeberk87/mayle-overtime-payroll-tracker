import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// Inline translations for email notifications
const tr = {
  en: {
    subjectApproved: (type: string) => `Your ${type} was Approved ✅`,
    subjectDeclined: (type: string) => `Your ${type} was Declined ❌`,
    bodyWithNotes: (type: string, date: string, status: string, notes: string) =>
      `Your ${type} entry for ${date} was ${status}. Admin note: "${notes}"`,
    bodyNoNotes: (type: string, date: string, status: string) =>
      `Your ${type} entry for ${date} was ${status}.`,
    approved: 'approved',
    declined: 'declined',
    overtime: 'overtime',
    expense: 'expense',
  },
  es: {
    subjectApproved: (type: string) => `Tu ${type} fue Aprobada ✅`,
    subjectDeclined: (type: string) => `Tu ${type} fue Rechazada ❌`,
    bodyWithNotes: (type: string, date: string, status: string, notes: string) =>
      `Tu entrada de ${type} para el ${date} fue ${status}. Nota del administrador: "${notes}"`,
    bodyNoNotes: (type: string, date: string, status: string) =>
      `Tu entrada de ${type} para el ${date} fue ${status}.`,
    approved: 'aprobada',
    declined: 'rechazada',
    overtime: 'horas extra',
    expense: 'gasto',
  },
  he: {
    subjectApproved: (type: string) => `ה${type} שלך אושרה ✅`,
    subjectDeclined: (type: string) => `ה${type} שלך נדחתה ❌`,
    bodyWithNotes: (type: string, date: string, status: string, notes: string) =>
      `רשומת ה${type} שלך לתאריך ${date} ${status}. הערת המנהל: "${notes}"`,
    bodyNoNotes: (type: string, date: string, status: string) =>
      `רשומת ה${type} שלך לתאריך ${date} ${status}.`,
    approved: 'אושרה',
    declined: 'נדחתה',
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
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { submitted_by, status, entity_type, entity_id, entry_date, review_notes } = await req.json();

    const isApproved = status === 'approved';

    // Look up the submitter to get their language preference
    const submitters = await base44.asServiceRole.entities.User.filter({ email: submitted_by });
    const submitter = submitters[0];

    const lang = getLang(submitter);
    const strings = tr[lang];
    const localType = entity_type === 'OvertimeSession' ? strings.overtime : strings.expense;
    const localStatus = isApproved ? strings.approved : strings.declined;

    const title = isApproved ? strings.subjectApproved(localType) : strings.subjectDeclined(localType);
    const message = review_notes
      ? strings.bodyWithNotes(localType, entry_date, localStatus, review_notes)
      : strings.bodyNoNotes(localType, entry_date, localStatus);

    // In-app notification for the submitter (in their language)
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