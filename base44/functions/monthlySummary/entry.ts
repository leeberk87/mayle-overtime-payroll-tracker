import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// Inline translations for monthly summary emails
const tr = {
  en: {
    subject: (month: string) => `Monthly Summary – ${month}`,
    body: (month: string, hours: string, otPay: number, expenses: number) =>
      `Your approved summary for ${month}: ${hours} overtime hours (₪${otPay}), ₪${expenses} in expenses. Log in to view your full breakdown.`,
    cta: 'Log in to view your full breakdown.',
  },
  es: {
    subject: (month: string) => `Resumen Mensual – ${month}`,
    body: (month: string, hours: string, otPay: number, expenses: number) =>
      `Tu resumen aprobado para ${month}: ${hours} horas extra (₪${otPay}), ₪${expenses} en gastos. Inicia sesión para ver el desglose completo.`,
    cta: 'Inicia sesión para ver el desglose completo.',
  },
  he: {
    subject: (month: string) => `סיכום חודשי – ${month}`,
    body: (month: string, hours: string, otPay: number, expenses: number) =>
      `הסיכום המאושר שלך עבור ${month}: ${hours} שעות נוספות (₪${otPay}), ₪${expenses} בהוצאות. התחבר לצפייה בפירוט המלא.`,
    cta: 'התחבר לצפייה בפירוט המלא.',
  },
};

// Month label localised per user language
function getMonthLabel(date: Date, lang: string): string {
  const locales: Record<string, string> = { en: 'en-US', es: 'es-ES', he: 'he-IL' };
  const locale = locales[lang] || 'en-US';
  return date.toLocaleString(locale, { month: 'long', year: 'numeric' });
}

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

    // Get last month in YYYY-MM format
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const ym = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

    const allUsers = await base44.asServiceRole.entities.User.list();
    const employees = allUsers.filter((u: any) => u.role === 'user');

    const allSessions = await base44.asServiceRole.entities.OvertimeSession.list();
    const allExpenses = await base44.asServiceRole.entities.Expense.list();

    for (const emp of employees) {
      const sessions = allSessions.filter((s: any) =>
        s.submitted_by === emp.email &&
        s.status === 'approved' &&
        s.date?.startsWith(ym)
      );
      const expenses = allExpenses.filter((e: any) =>
        e.submitted_by === emp.email &&
        e.status === 'approved' &&
        e.date?.startsWith(ym)
      );

      const totalOT = sessions.reduce((sum: number, s: any) => sum + (s.ot_pay || 0), 0);
      const totalExp = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
      const otHours = sessions.reduce((sum: number, s: any) => sum + (s.duration_minutes || 0), 0) / 60;

      const lang = getLang(emp);
      const strings = tr[lang];
      const monthLabel = getMonthLabel(lastMonth, lang);

      const title = strings.subject(monthLabel);
      const message = strings.body(monthLabel, otHours.toFixed(1), totalOT, totalExp);

      await base44.asServiceRole.entities.Notification.create({
        recipient_email: emp.email,
        title,
        message,
        type: 'monthly_summary',
        is_read: false,
      });

      if (emp.notification_email !== false) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: emp.email,
          subject: title,
          body: `<p>${message}</p>`,
        });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
