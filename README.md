# Premier Pro Services

Commercial real estate field service management platform. Carpet, janitorial, and property services — streamlined for teams of 13+ technicians with full mobile support.

**Live:** [https://premier-pro-services.vercel.app](https://premier-pro-services.vercel.app)

## Tech Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Prisma ORM** + **Supabase PostgreSQL**
- **NextAuth v4** (Credentials provider, JWT strategy)
- **Tailwind CSS**
- Leaflet + react-leaflet (GPS tracking)
- QRCode (equipment tracking)
- bcryptjs, zod, lucide-react, sonner, date-fns

## Quick Start

```bash
npm install
npx prisma db push
npm run seed
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Demo Login

| Email | Password | Role |
|---|---|---|
| `admin@premierpro.com` | `admin123` | Admin |
| `ops@premierpro.com` | `admin123` | Ops Manager |
| `billing@premierpro.com` | `admin123` | Billing |
| `james.mitchell@premierpro.com` | `tech123` | Technician |

## Features

- 📸 **Photo Capture** — Technicians take arrival/job photos via mobile camera
- 🗺️ **GPS Tracking** — Live van tracking with 15s location updates on Leaflet maps
- 📋 **Field Orders** — Full mobile order management (accept, arrive, complete) on phones/tablets
- 💰 **Auto Invoicing** — Invoice auto-generated on job completion with PDF download
- 📊 **Reports Dashboard** — Revenue, expenses, profit margin, invoice aging, service breakdowns
- 🏷️ **QR Equipment Tracking** — Generate QR codes for equipment deployed at worksites
- 📝 **HR / Offer Letters** — Create and send offer letters with DocuSign-ready templates
- 🔐 **Role-based Access** — Admin, Office Staff, Crew Lead roles with permission guards
- 📱 **PWA** — Installable on mobile devices with offline manifest

## Pages

| Route | Purpose |
|---|---|
| `/` | Login page |
| `/dashboard` | Stats overview |
| `/orders` | Work order management |
| `/field` | Technician field tracking (camera, GPS, time entries) |
| `/tracking` | Live GPS map of all technician vans |
| `/crews` | Crew & technician management |
| `/calendar` | Scheduling calendar |
| `/invoicing` | Invoice list |
| `/invoicing/[id]` | Invoice detail + PDF |
| `/expenses` | Expense tracking |
| `/accounting` | Accounting overview |
| `/reports` | Analytics dashboard |
| `/equipment` | QR code equipment management |
| `/hr` | Offer letters & HR |
| `/settings` | App settings |
| `/portal` | Customer portal login |
| `/portal/dashboard` | Customer-facing dashboard |

## API Routes

| Method | Route | Auth |
|---|---|---|
| `POST` | `/api/auth/[...nextauth]` | Cookie |
| `GET` | `/api/orders/active` | Session |
| `POST` | `/api/orders/complete` | Session |
| `POST` | `/api/field-notes` | Session |
| `POST` | `/api/time-entries` | Session |
| `GET/POST` | `/api/crew/location` | Session |
| `GET/POST` | `/api/equipment` | Session |
| `PATCH/DELETE` | `/api/equipment/[id]` | Session |
| `GET` | `/api/equipment/[id]/qr` | Session |
| `GET/POST` | `/api/offer-letters` | Session |
| `PATCH` | `/api/offer-letters/[id]` | Session |
| `POST` | `/api/offer-letters/[id]/send` | Session |
| `GET` | `/api/invoice/[id]/pdf` | Session |
| `POST` | `/api/upload` | Session |

## Data Model

- **User** — email, name, password, role (ADMIN/OFFICE_STAFF/CREW_LEAD/CUSTOMER), phone
- **Crew** — name, lead, vehicle info, live GPS coordinates
- **Customer** — company name, contact, billing address, portal token
- **Property** — address, access notes, linked to customer
- **ServiceType** — name, description, base price, checklist template
- **WorkOrder** — order number, status, priority, crew assignment, pricing
- **Invoice** — auto-generated on completion, with line items, tax, payments
- **FieldNote** — photos, notes, issues, signatures from the field
- **TimeEntry** — arrival, departure, break timestamps
- **Equipment** — QR code, type, status, deployed location
- **OfferLetter** — position, salary, HTML template, signature status
- **Expense** — vendor, category, amount, linked to work order

## Deployment

Deploy to Vercel:

```bash
npx vercel --prod --yes
```

Environment variables on Vercel:
- `DATABASE_URL` — Supabase PostgreSQL connection string
- `NEXTAUTH_SECRET` — JWT signing secret (min 32 chars)
- `NEXTAUTH_URL` — Production URL (e.g., `https://premier-pro-services.vercel.app`)
