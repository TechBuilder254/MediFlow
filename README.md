# MediFlow — Hospital Management System

A modern, cloud-based Hospital Management System built with **React + TypeScript + Vite + Supabase**.

## Features

- Professional landing page with hero, features, stats, testimonials, and FAQ
- Role-based authentication (Super Admin, Admin, Doctor, Nurse, Receptionist, Pharmacist, Lab Technician, Cashier, Patient)
- Dashboard with real-time statistics and charts
- Patient registration with QR codes and medical history
- Appointments, queue management, and admissions
- Laboratory, pharmacy, inventory, and billing modules
- Reports, audit logs, and hospital settings
- Patient portal for self-service

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4
- **State:** TanStack Query, Zustand
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts
- **Backend:** Supabase (PostgreSQL, Auth, RLS, Storage)

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project

### Setup

1. Clone and install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Add your Supabase URL and anon key to `.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. Apply the database migration (already applied if using the linked Supabase project).

5. Start the dev server:

```bash
npm run dev
```

6. Open [http://localhost:5173](http://localhost:5173)

### First User

Register via the login page. The first account defaults to the **patient** role. To make yourself an admin, update your role in Supabase:

```sql
UPDATE profiles SET role = 'super_admin' WHERE email = 'your@email.com';
```

## Design

- **Primary:** Teal (`#0d9488`) — healthcare trust and calm
- **Navy:** Deep sidebar (`#0a1929`) — professional contrast
- **Accent:** Sky blue — interactive highlights
- **Typography:** Plus Jakarta Sans (headings) + DM Sans (body)

## Project Structure

```
src/
├── app/           # App root
├── components/    # UI, charts, layouts
├── features/      # Feature modules
├── hooks/         # Custom hooks
├── lib/           # Supabase client
├── routes/        # Route guards
├── services/      # API services
├── types/         # TypeScript types
└── utils/         # Helpers
```

## License

MIT
