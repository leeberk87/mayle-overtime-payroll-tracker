# Mayle Overtime Payroll Tracker

A payroll tracker for our nanny — built for personal family use, with a roadmap to become a generic commercial SaaS product.

## What it does

Tracks monthly pay by combining four components:

| Component | Description |
|---|---|
| Base salary | Fixed monthly amount, configurable per month |
| Transport allowance | Fixed monthly transport contribution |
| Overtime pay | Hours logged × hourly rate (rounded to 15-min increments) |
| Expense reimbursements | Individual expenses submitted and approved |

**Grand total = base salary + transport allowance + overtime pay + approved expenses**

Currency: Israeli Shekel (₪)

---

## Features

### For the employee (regular user)
- Log overtime sessions with start/end times — pay is calculated automatically
- Submit expense reimbursements with descriptions and amounts
- View monthly salary summary (current and past months)
- Request deletion of previously approved entries
- In-app and email notifications when entries are approved or declined

### For the employer (admin)
- Approve or decline submitted overtime and expense entries
- Configure base salary, transport allowance, and overtime hourly rate — per month, with historical snapshots so past calculations stay accurate
- Invite users and assign roles (admin or regular user)
- Review and action deletion requests
- Monthly summary notifications sent automatically to employees

### General
- Approval workflow: entries start as pending → approved or declined
- Multilingual: English, Hebrew (RTL), Spanish
- Mobile-first layout (512px), built to scale to tablet and desktop
- Planned iOS/Android release via Capacitor

---

## Tech stack

- **Frontend**: React 18 + Vite, TanStack Query, React Hook Form, Radix UI, Tailwind CSS
- **Backend**: [Base44](https://base44.com) SDK + Deno serverless functions
- **GitHub ↔ Base44 sync**: changes pushed to GitHub are automatically reflected in the Base44 builder

### Backend functions (Deno)
| Function | What it does |
|---|---|
| `notifyOnSubmission` | Alerts admins when a new entry is submitted |
| `notifyOnStatusChange` | Notifies the employee when an entry is approved or declined |
| `monthlySummary` | Sends monthly pay summaries to employees |
| `expireInvitations` | Cleans up expired user invitations |

---

## Local setup

**Prerequisites:** Node.js installed, and a Base44 account with this app configured.

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd mayle-overtime-payroll-tracker

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env.local  # or create .env.local manually
```

Add the following to `.env.local`:

```
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_app_base_url
```

```bash
# 4. Run locally
npm run dev
```

**To publish changes**, push to GitHub — Base44 picks up the latest automatically on each new session. You can also click **Publish** in the Base44 builder.

---

## Docs & support

- Base44 GitHub integration: [https://docs.base44.com/Integrations/Using-GitHub](https://docs.base44.com/Integrations/Using-GitHub)
- Base44 support: [https://app.base44.com/support](https://app.base44.com/support)
