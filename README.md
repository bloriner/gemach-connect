# Gemach Connect

A directory platform for Jewish community members to find and list **Gemachs** — free lending organizations — across North America. Browse, search, register, list your own gemachs, send donation offers, and message organizers.

## Tech Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Prisma ORM** + **SQLite** (`prisma/dev.db`)
- **NextAuth v4** (Credentials provider, JWT strategy)
- **Tailwind CSS**
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

| Email | Password |
|---|---|
| `demo@gemach.app` | `demo1234` |

## Features

- 🔍 **Browse & Search** — Filter gemachs by category, state, and keyword
- ❤️ **Favorites** — Bookmark gemachs for quick access
- 📦 **Offers** — Submit donation offers with status workflow (pending → accepted → completed)
- 💬 **Two-pane Messaging** — Threaded conversations between donors and gemach owners
- 🕐 **"Open Now"** — Live status computed from structured weekly hours
- 📱 **Responsive** — Works on mobile, tablet, and desktop
- 🔐 **Owner-only permissions** — Enforced on both API and UI

## Pages

| Route | Purpose |
|---|---|
| `/` | Public landing |
| `/login` | Sign in |
| `/register` | Create account |
| `/dashboard` | Stats overview |
| `/dashboard/my-gemachs` | Manage your listings |
| `/dashboard/new` | Create a gemach |
| `/dashboard/edit/[id]` | Edit a gemach |
| `/dashboard/requests` | Incoming & outgoing offers |
| `/dashboard/messages` | Two-pane messaging inbox |
| `/dashboard/saved` | Bookmarked gemachs |
| `/dashboard/profile` | User profile |
| `/gemachs` | Browse & discover |
| `/gemachs/[id]` | Gemach detail + contact |

## API Routes

| Method | Route | Auth |
|---|---|---|
| `POST` | `/api/auth/[...nextauth]` | Cookie |
| `POST` | `/api/register` | Public |
| `GET/POST` | `/api/gemachs` | POST requires session |
| `GET/PUT/DELETE` | `/api/gemachs/[id]` | PUT/DELETE owner only |
| `GET` | `/api/favorites` | Session |
| `POST` | `/api/favorites` (toggle) | Session |
| `GET/POST` | `/api/offers` | Session |
| `PATCH/DELETE` | `/api/offers/[id]` | Status: owner; edit: donor |
| `GET/POST` | `/api/threads` | Session |
| `GET/POST` | `/api/threads/[id]` | Participants only |
| `GET/POST` | `/api/messages` | Session |

## Data Model

- **User** — name, email, password, phone, city, state
- **Gemach** — name, category, address, hours (JSON), needs (JSON), pickup notes, options
- **Offer** — donation offer with status workflow (pending/accepted/completed/declined)
- **Thread** — 1:1 conversation scoped to gemach+user, unique constraint
- **Message** — body, sender, timestamp within a thread
- **Favorite** — user+gemach composite key

## Deployment

Deploy to Vercel with a single click. Ensure `prisma db push` runs on each deploy (included in `npm run build`).

For production, switch to PostgreSQL via `DATABASE_URL` in `.env` and update the Prisma datasource.

## License

MIT
