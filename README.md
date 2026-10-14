# SAIS BookFlow

> **Premium International-Quality Appointment-Booking & Intelligence Platform**  
> Engineered by **SAIS Labs** for high-touch service enterprises: salons, photographers, tutors, consultants, and event planners.

---

## 🌟 Executive Overview

**SAIS BookFlow** is a full-stack, enterprise-grade appointment scheduling web application built on the **Next.js App Router**, **TypeScript**, **Tailwind CSS**, and **Supabase PostgreSQL**.

Unlike conventional booking platforms that check availability solely on the client side, SAIS BookFlow guarantees **zero double-bookings** via a dual-layer concurrency architecture:
1. **Database-Level Exclusion Constraint:** Powered by PostgreSQL `btree_gist` and `tstzrange` exclusion constraints (`EXCLUDE USING gist (tstzrange(start_time, end_time) WITH &&) WHERE (status IN ('Pending', 'Confirmed'))`).
2. **Server-Side Atomic Mutex Execution:** Server-side route handlers serialize concurrent reservation attempts, ensuring that even simultaneous requests submitted at the exact same millisecond are resolved deterministically (one succeeds, one receives an immediate `409 Conflict`).

---

## 🛠 Tech Stack

- **Framework:** Next.js 14 (App Router, Server & Client Components, Route Handlers)
- **Language:** TypeScript 5.6 (strict mode enabled)
- **Styling & UI:** Tailwind CSS, custom design tokens (Warm white surface, Deep navy text `#0F172A`, subtle teal accent `#0D9488`), Lucide React icons
- **Form Handling & Validation:** React Hook Form, Zod schema validation
- **Database & Auth:** Supabase PostgreSQL, Row Level Security (RLS) policies, `@supabase/ssr`, `@supabase/supabase-js`
- **Testing Engine:** Vitest 2.1 (unit, integration, and simultaneous concurrency tests)
- **Deployment:** Vercel

---

## 🚀 Key Features

### Public Customer Experience
1. **Interactive Service Catalog:** Multi-vertical support (Consulting, Photography, Salons, Tutoring, Event Planning) with duration and pricing filters.
2. **4-Stage Booking Wizard:**
   - **Step 1:** Select service and review session details.
   - **Step 2:** Select appointment date from a 14-day interactive carousel and pick an available slot.
   - **Step 3:** Enter client details (name, email, phone, special preparation notes) with real-time validation.
   - **Step 4:** Review request parameters and submit atomically.
3. **Booking Reference & Transparency:** Generates unique, human-friendly references (e.g. `BF-7K9M2P`). Complies with strict integrity rules: requests are flagged **Pending** until confirmed by administrative review, while reserving the slot.
4. **Self-Service Status Lookup:** Track approval timeline, scheduled times, and audit event logs with masked contact details for privacy.
5. **Studio Contact & Operating Hours:** Clear business hours and studio location in configurable timezone (`America/New_York`).

### Admin Console & Operations
- **Secure Authentication:** Protected route guards and HTTP-only session cookies.
- **KPI Dashboard:** Live metrics for Pending Approvals, Confirmed Appointments, Completed Sessions, and Total Volume.
- **Appointments Management:** Filter by status (`Pending`, `Confirmed`, `Completed`, `Cancelled`, `Rejected`), search by reference or client name.
- **One-Click Actions:** Confirm pending requests, cancel sessions (which automatically frees the slot), or mark completed.
- **Atomic Rescheduling:** Reschedule appointments to new slots with server-side concurrency checking and conflict prevention.
- **Service Management:** Add new services, edit prices/durations, toggle active status, or remove services.
- **Availability Settings:** Configure opening and closing hours per day of week, toggle closed days, and manage studio blackout dates.

---

## 🧪 Automated Test Suite

SAIS BookFlow includes an automated Vitest test suite testing critical domain constraints and concurrency guarantees:

```bash
node ./node_modules/vitest/vitest.mjs run
```

### Verified Test Results (12/12 Passed):
- `src/test/booking.test.ts`:
  - `✓ 1. Creates a booking successfully with unique reference and Pending status`
  - `✓ 2. Rejects booking with invalid service ID`
  - `✓ 3. Rejects booking on closed days (e.g. Sunday)`
  - `✓ 4. Prevents overlapping time slots sequentially`
  - `✓ 5. CRITICAL CONCURRENCY: Two simultaneous requests for the exact same slot resolve atomically (1 success, 1 conflict)`
- `src/test/admin.test.ts`:
  - `✓ 1. Admin authentication validates credentials accurately`
  - `✓ 2. Admin can confirm a pending booking and audit event is recorded`
  - `✓ 3. Admin can cancel a booking, which releases the time slot for new bookings`
  - `✓ 4. Rescheduling into an unavailable/occupied slot is rejected with conflict error`
  - `✓ 5. Rescheduling into an open slot succeeds and logs reschedule audit event`
- `src/test/flow.test.ts`:
  - `✓ 1. Complete customer booking flow from catalog to reference lookup`
  - `✓ 2. Blackout dates / blocked periods properly disable all overlapping slots`

---

## 💻 Local Setup & Development

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd "SAIS BookFlow"
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Default demo configuration:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BUSINESS_NAME="SAIS BookFlow"
NEXT_PUBLIC_BUSINESS_TIMEZONE="America/New_York"
NEXT_PUBLIC_BUSINESS_CURRENCY="USD"
NEXT_PUBLIC_BUSINESS_CURRENCY_SYMBOL="$"

ADMIN_EMAIL=admin@saisbookflow.com
ADMIN_PASSWORD=AdminSecurePass2025!
```

> **Note:** The application includes a high-fidelity local transactional store with atomic mutex locking that runs immediately without needing cloud credentials for portfolio review. When Supabase keys are added, it seamlessly connects to live PostgreSQL.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the public application.  
Open [http://localhost:3000/admin/login](http://localhost:3000/admin/login) to access the Admin Console (use the "Fill Demo Credentials" button).

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🗄 Supabase Setup & Database Migrations

### 1. Create a Supabase Project
1. Navigate to [Supabase](https://supabase.com/) and create a new project.
2. Note your **Project URL**, **Anon Public Key**, and **Service Role Secret Key** from `Project Settings > API`.

### 2. Apply SQL Migrations
1. Open the Supabase **SQL Editor**.
2. Run the migration script located at [`supabase/migrations/20241015000000_init_bookflow.sql`](./supabase/migrations/20241015000000_init_bookflow.sql).
   - Enables `btree_gist` and `uuid-ossp` extensions.
   - Creates `services`, `business_hours`, `blocked_periods`, `bookings`, and `booking_events`.
   - Creates the exclusion constraint `no_overlapping_active_bookings`.
   - Enables Row Level Security (RLS) policies.
   - Attaches automated audit logging triggers.
3. Run the seed data script located at [`supabase/seed.sql`](./supabase/seed.sql) to populate initial sample services and standard business hours.

### 3. Add Supabase Keys to `.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

---

## 🚢 Deploying to Vercel

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete SAIS BookFlow appointment booking platform"
   git branch -M main
   git remote add origin https://github.com/<your-username>/sais-bookflow.git
   git push -u origin main
   ```
2. In the [Vercel Dashboard](https://vercel.com/):
   - Click **Add New... > Project**.
   - Import your GitHub repository `sais-bookflow`.
   - Under **Environment Variables**, add:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `ADMIN_EMAIL`
     - `ADMIN_PASSWORD`
     - `NEXT_PUBLIC_BUSINESS_TIMEZONE` (`America/New_York`)
     - `NEXT_PUBLIC_BUSINESS_CURRENCY` (`USD`)
     - `NEXT_PUBLIC_BUSINESS_CURRENCY_SYMBOL` (`$`)
3. Click **Deploy**. Vercel will run `npm run build` and provision your production deployment URL.

---

## 🔒 Security & Privacy Architecture

- **Public Isolation:** Public visitors can only query active services and calculate open slots.
- **Privacy Masking:** Booking reference lookup displays customer contact details with masked privacy strings (`al****@example.com`, `+1 202-***-99`) for unauthorized visitors.
- **Admin Row Level Security:** Unauthenticated users cannot read arbitrary customer bookings or manipulate service pricing or blackout dates.
- **Exclusion Constraints:** Guaranteed race-condition prevention across all client and admin reschedule operations.

---

## 📄 License & Credits

Crafted by **SAIS Labs**. Released for demonstration and commercial portfolio evaluation.
