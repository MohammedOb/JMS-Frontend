# JMS Optimus — Jamaat Management System (Frontend)

A comprehensive web application for managing Jamaat (Islamic community) operations. Built with Next.js 16 and React 19, it provides administrators with tools for member management, dues collection, event coordination, seating allocation, messaging, and more.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI Library | React 19 |
| Styling | Tailwind CSS 3 |
| HTTP Client | Axios |
| Rich Text | TipTap |
| PDF Export | jsPDF + jsPDF-autotable |
| Excel | xlsx |
| Icons | Lucide React |
| Notifications | React Hot Toast |
| Auth (cookies) | js-cookie |

---

## Prerequisites

- Node.js `>=20.9.0 <25`
- A running instance of the JMS API backend

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# URL of the backend API (include trailing slash)
NEXT_PUBLIC_API_URL=http://localhost:5000/

# Optional: allow access from LAN/IP during development
NEXT_ALLOWED_DEV_ORIGINS=http://192.168.x.x:3000
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> Use `npm run dev:turbo` for the faster Turbopack-based dev server (experimental).

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server (webpack) |
| `npm run dev:turbo` | Start development server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint on `src/` |

---

## Production Deployment

```bash
cp .env.production.example .env.production.local
# Set NEXT_PUBLIC_API_URL to your deployed backend URL
npm run build
npm start
```

---

## Features & Pages

### Member Management
- **Member Search** — search and filter Jamaat members
- **Member Details** — full profile, family tab, vajebaat (obligations), takhmeen (dues assessment), follow-up history, safai chitthi (cleaning records), and password reset

### Dues & Takhmeen
- **Mumin Takhmeen** — annual dues assessment report
- **Takhmeen Not Done** — members with pending assessments
- **Bulk Takhmeen** — batch assessment entry
- **Takhmeen Alert Rules** — configure automated reminders
- **Due Details** — outstanding dues tracking
- **Add Receipt** — quick receipt entry

### Financial
- **Expense Report** — record and review expenses
- **Income / Expense Heads** — manage account categories
- **Daily Report** — day-by-day financial summary

### Community
- **Mohallah** — local unit (neighborhood) management with coordinator tables and print options
- **Distribution** — resource/item distribution tracking
- **Follow-up** — member follow-up task management

### Events & Scheduling
- **Calendar** — Hijri/Gregorian dual calendar with event scheduling
- **Majlis** — gathering registration and list management
- **Seating Layout** — hall and section configuration, seat grid with booking, auto-assign, void, and block-range tools
- **Event Forms** — custom form builder with conditional logic, eligibility rules, question bank, and response viewer

### Messaging & Notifications
- **WhatsApp Status** — monitor WhatsApp connectivity
- **WhatsApp Templates** — manage message templates
- **WA Queue / WA Bulk** — send scheduled and bulk WhatsApp messages
- **App Notifications** — in-app notification management

### Administration
- **Access Control** — users, roles, permissions, scopes, and audit log
- **System Variables** — global configuration values
- **Theme Settings** — UI theming
- **FMB Daily Menu** — food/meal menu management
- **ITS Data** — ITS directory integration
- **Design Templates** — printable design templates
- **Utility** — miscellaneous admin tools

### Member Portal (`/mumin/*`)
Mobile-optimised self-service portal for community members:
- **Profile** — view and edit personal information
- **Dues** — outstanding dues overview
- **Receipts** — personal payment history
- **Notifications** — receive in-app messages
- **Payment Result** — payment gateway callback page

### Public
- **Registration Portal** (`/reg/[formId]`) — public-facing multi-step event registration form
- **FMB Feedback** (`/feedback/menu/[id]`) — food/meal menu feedback collection

---

## Authentication & Permissions

All dashboard routes are protected by a cookie-based authentication layer. After login, each route is guarded by a fine-grained permission code (e.g., `members.view`, `expenses.view`, `seating.view`). Unauthorised users are redirected automatically.

Permissions are managed under **Access Control** and assigned per role or per user via scopes.

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/          # Login page
│   ├── (dashboard)/           # Protected dashboard routes
│   │   ├── layout.jsx         # Auth + permission guard wrapper
│   │   └── <feature>/         # One directory per feature
│   └── reg/[formId]/          # Public registration portal
├── components/
│   ├── layout/                # Sidebar, Topbar
│   └── shared/                # Badge, Modal, ComboBox, PermissionGuard, PageHeader
├── context/                   # AuthContext, SystemVarsContext
├── lib/                       # Shared cache utilities
└── utils/                     # Receipt utilities, eligibility config
```

---

## Docker

A `Dockerfile` (multi-stage, Node 22 Alpine) and `docker-compose.yml` are included for containerised deployments.

```bash
cp .env.docker.example .env
docker compose up --build
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API base URL (with trailing slash) |
| `NEXT_ALLOWED_DEV_ORIGINS` | No | Comma-separated LAN origins for dev server |
| `PAYMENT_URL_SECRET` | Production | Secret key for payment gateway result verification |
