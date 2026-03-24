import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

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
    const monthLabel = lastMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

    const allUsers = await base44.asServiceRole.entities.User.list();
    const employees = allUsers.filter(u => u.role === 'user');

    const allSessions = await base44.asServiceRole.entities.OvertimeSession.list();
    const allExpenses = await base44.asServiceRole.entities.Expense.list();

    for (const emp of employees) {
      const sessions = allSessions.filter(s =>
        s.submitted_by === emp.email &&
        s.status === 'approved' &&
        s.date?.startsWith(ym)
      );
      const expenses = allExpenses.filter(e =>
        e.submitted_by === emp.email &&
        e.status === 'approved' &&
        e.date?.startsWith(ym)
      );

      const totalOT = sessions.reduce((sum, s) => sum + (s.ot_pay || 0), 0);
      const totalExp = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const otHours = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / 60;

      const title = `Monthly Summary – ${monthLabel}`;
      const message = `Your approved summary for ${monthLabel}: ${otHours.toFixed(1)} overtime hours (₪${totalOT}), ₪${totalExp} in expenses.`;

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
          body: `<p>${message}</p><p>Log in to view your full breakdown.</p>`,
        });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});