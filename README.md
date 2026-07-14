# FieldService Pro

A modern field service management platform built for a Michigan-based real estate services company. Replaces old-school paper processes with real-time order tracking, crew dispatching, invoicing, and a customer portal.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) |
| Language | TypeScript |
| Styling | TailwindCSS |
| Database | SQLite (dev) / PostgreSQL via [Supabase](https://supabase.com/) (prod) |
| ORM | Prisma |
| Icons | Lucide React |
| Mobile | Capacitor-ready (PWA manifest included) |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Initialize the database
npx prisma db push

# 3. Seed with sample data
npx tsx prisma/seed.ts

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Test Accounts (seeded)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@fieldservice.pro | password123 |
| Office Staff | sarah@fieldservice.pro | password123 |
| Crew Lead | lead1@fieldservice.pro | password123 |
| Crew Member | member1@fieldservice.pro | password123 |

## Customer Portal

Customers can track orders and view invoices at `/portal`. Portal tokens (seeded):

| Customer | Token |
|----------|-------|
| Great Lakes Realty | `portal-greatlakes-2026` |
| Michigan Home Sales | `portal-mihomes-2026` |
| Lakefront Properties | `portal-lakefront-2026` |
| Metro Detroit Real Estate | `portal-metrodetroit-2026` |

## Features

### Operations
- **Dashboard** — KPI cards, recent orders, active field status
- **Orders** — Full order lifecycle: PENDING → DISPATCHED → EN_ROUTE → ON_SITE → COMPLETED → INVOICED
- **Calendar** — Monthly scheduling view with crew assignments
- **Crews** — 9 crews with leads and members
- **Field Tracking** — Arrival/departure time logging, notes, photos

### Finance
- **Accounting** — P&L statements (MTD/YTD), expenses by category, payment tracking
- **Invoicing** — Line items, PDF generation, payment recording
- **Expenses** — 7 categories (materials, labor, fuel, equipment, software, travel, other)
- **Reports** — Revenue by customer, crew performance, monthly trends, service breakdown

### Customer Portal
- Token-based access
- Order status tracking
- Invoice history with balances
- Public-facing, no login required

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/         # Admin/office pages (with sidebar)
│   │   ├── page.tsx         # Main dashboard
│   │   ├── orders/          # Work order management
│   │   ├── calendar/        # Scheduling calendar
│   │   ├── crews/           # Crew management
│   │   ├── field/           # Field tracking
│   │   ├── accounting/      # P&L, financial overview
│   │   ├── invoicing/       # Invoice list + detail pages
│   │   ├── expenses/        # Expense tracking
│   │   ├── reports/         # Business analytics
│   │   └── settings/        # Company configuration
│   ├── portal/              # Customer-facing portal
│   ├── api/                 # API routes (PDF generation, etc.)
│   └── globals.css
├── components/
│   ├── dashboard/           # Sidebar, layout shell
│   └── ui/                  # Button, Card, Badge, Input
└── lib/
    ├── prisma.ts            # Database client
    └── utils.ts             # Formatting, constants
```

## Deployment

### Option 1: Vercel (easiest)
1. Push to GitHub
2. Import repo at [vercel.com](https://vercel.com)
3. Add environment variable: `DATABASE_URL` (Supabase connection string)
4. Deploy

### Option 2: Docker
```bash
docker build -t fieldservice-pro .
docker run -p 3000:3000 fieldservice-pro
```

## Database

Default is SQLite (zero config). For production, switch to PostgreSQL:

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## License

Private — All rights reserved.
