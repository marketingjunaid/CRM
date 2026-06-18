# SmartCRM

A complete CRM web application built with Next.js 14, TypeScript, Tailwind CSS, Prisma, and PostgreSQL.

## Features

- **Authentication** – Login, Register, Forgot Password, Role-based access (Admin/Manager/Sales User)
- **Dashboard** – Stats, charts, activity feed, upcoming tasks
- **Leads** – Full CRUD, status/source filters, convert to contact+deal
- **Contacts** – Full CRUD, search, linked deals & tasks
- **Companies** – Full CRUD, linked contacts & deals
- **Pipeline** – Kanban board with drag & drop + list view
- **Tasks** – Assign, prioritize, link to leads/contacts/deals
- **Notes & Activities** – Timeline on every entity
- **Team Management** – Admin invite/manage users
- **Global Search** – Search across all entities
- **Email Logging** – Log emails manually under contacts/leads

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes |
| Database | PostgreSQL (Supabase / Neon) |
| ORM | Prisma |
| Auth | NextAuth.js (JWT) |
| UI | Tailwind CSS, lucide-react, recharts |
| DnD | @dnd-kit |

## Quick Start

### 1. Clone & Install

```bash
git clone <repo>
cd smartcrm
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://user:password@host:5432/smartcrm"
NEXTAUTH_SECRET="your-32-char-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Database Setup

```bash
# Run migrations
npx prisma migrate dev --name init

# Seed with demo data
npm run prisma:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo Accounts

| Role | Email | Password |
|------|-------|---------|
| Admin | admin@smartcrm.com | Admin@123 |
| Manager | manager@smartcrm.com | User@123 |
| Sales User | sales@smartcrm.com | User@123 |

## Deployment to Vercel

### 1. Create PostgreSQL Database

Use [Neon](https://neon.tech) or [Supabase](https://supabase.com) for free PostgreSQL hosting.

### 2. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 3. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and import your GitHub repo
2. Add environment variables:
   - `DATABASE_URL` – your PostgreSQL connection string
   - `NEXTAUTH_SECRET` – random 32-char string
   - `NEXTAUTH_URL` – your Vercel deployment URL
3. Deploy!

### 4. Run Migrations on Production

```bash
# Using Vercel CLI
vercel env pull .env.production
npx prisma migrate deploy
npm run prisma:seed
```

## Database Migrations

```bash
# Create new migration
npx prisma migrate dev --name <migration-name>

# Apply migrations in production
npx prisma migrate deploy

# Reset database (dev only!)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```

## Role Permissions

| Feature | Admin | Manager | Sales User |
|---------|-------|---------|-----------|
| View all records | ✅ | ✅ | Own only |
| Create records | ✅ | ✅ | ✅ |
| Delete records | ✅ | ✅ | ❌ |
| Manage users | ✅ | ❌ | ❌ |
| View team data | ✅ | ✅ | ❌ |

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/     # Protected routes
│   │   ├── dashboard/
│   │   ├── leads/
│   │   ├── contacts/
│   │   ├── companies/
│   │   ├── deals/
│   │   ├── tasks/
│   │   ├── team/
│   │   └── settings/
│   ├── api/             # API routes
│   │   ├── auth/
│   │   ├── leads/
│   │   ├── contacts/
│   │   ├── companies/
│   │   ├── deals/
│   │   ├── tasks/
│   │   ├── notes/
│   │   ├── emails/
│   │   ├── users/
│   │   ├── search/
│   │   └── dashboard/
│   └── auth/            # Auth pages
├── components/
│   ├── layout/          # Sidebar, Topbar
│   ├── ui/              # Reusable components
│   ├── leads/
│   ├── contacts/
│   ├── companies/
│   ├── deals/
│   ├── tasks/
│   ├── notes/
│   └── activity/
├── lib/
│   ├── auth.ts          # NextAuth config
│   ├── prisma.ts        # Prisma client
│   ├── utils.ts         # Helpers
│   ├── validations.ts   # Zod schemas
│   └── session.ts       # Session helpers
└── types/
    └── index.ts         # TypeScript types
```
