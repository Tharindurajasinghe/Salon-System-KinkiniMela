# Salon System — Website + POS (Hybrid)

Single Next.js 14 (App Router) project with a real backend, MongoDB Atlas, JWT
auth, bilingual (English / Sinhala) UI, Cloudinary uploads, SMS notifications,
80mm thermal printing and Sri Lanka timezone handling. Built by **TAR Solutions**.

---

## Tech stack

| Concern        | Choice                                             |
| -------------- | -------------------------------------------------- |
| Framework      | Next.js 14 (App Router, JavaScript)                |
| Styling        | Tailwind CSS (salon theme tokens in tailwind.config) |
| Animations     | Framer Motion + custom keyframes                   |
| Database       | MongoDB Atlas via Mongoose                         |
| Auth           | JWT in httpOnly cookie (staff only)                |
| Images         | Cloudinary                                         |
| SMS            | Sri Lankan gateway (text.lk / notify.lk style)     |
| Icons          | lucide-react                                       |
| Dates          | date-fns + date-fns-tz (Asia/Colombo)              |
| Deploy         | Vercel (+ Vercel Cron)                             |

---

## Folder structure

```
src/
├─ app/
│  ├─ layout.jsx            # root layout: fonts + LanguageProvider
│  ├─ globals.css
│  ├─ (site)/               # [PHASE 3] customer website (navbar + footer)
│  ├─ admin/                # [PHASE 4] admin + cashier area (navbar, no footer)
│  ├─ login/                # [PHASE 2] staff login page
│  └─ api/                  # backend route handlers
│     └─ auth/login/route.js
├─ components/
│  └─ ui/                   # reusable primitives (Button, Card, Modal, ...)
├─ context/
│  └─ LanguageProvider.jsx  # EN/SI switcher (cookie-based, SSR-safe)
├─ lib/
│  ├─ db.js                 # cached Mongoose connection (serverless-safe)
│  ├─ auth.js               # server session + page-access guard
│  ├─ settings.js           # global salon settings accessor
│  ├─ models/               # all Mongoose schemas
│  ├─ services/             # OOP: SmsService, CloudinaryService
│  ├─ utils/                # timezone, jwt, apiResponse, idGenerator, discount, currency
│  └─ i18n/                 # dictionaries + registry
├─ middleware.js            # protects /admin/* routes
scripts/
└─ seedAdmin.mjs            # bootstrap first admin + default settings
```

## Design principles (from the spec)

- **OOP** for external integrations (`SmsService`, `CloudinaryService`).
- **DRY** — one `Button`, one `apiResponse`, one discount engine, one SMS
  template set. Nothing styled or written twice.
- **Reusable UI** primitives under `components/ui`.
- **Comments** throughout explaining the *why*.
- **Secrets in `.env` only** — never in the database.
- **Sri Lanka time everywhere** via `lib/utils/timezone.js`.
- **Lazy loading** for long lists (implemented per-page with intersection
  observers when we build the product/service grids).

---

## Setup

```bash
npm install
cp .env.example .env      # then fill MONGODB_URI, JWT_SECRET, Cloudinary, SMS
node scripts/seedAdmin.mjs   # creates admin / admin123 + default settings
npm run dev
```

> On Windows Command Prompt, clear the Next.js cache with: `rmdir /s /q .next`

---

## Build roadmap

**Phase 1 — Foundation ✅**
Config, DB, all models, OOP services, auth + login API, middleware, i18n,
timezone, discount engine, reusable Button, seed script.

**Phase 2 — Auth UI + Admin shell ✅**
Login page, admin/cashier layout with role-based sidebar (via `canAccess`),
Settings page (salon info + integrations) + `/api/settings` + `/api/upload`.

**Phase 3 — Catalogue ✅**
Categories page (product/service), and the "Our Services" page with Products,
Services and Packages tabs — full CRUD, activate/deactivate, search, image
upload, time slots, discounts. APIs: `/api/categories`, `/api/products`,
`/api/services`, `/api/packages` (bracket-free; item ops via body/query so the
project stays safe to unzip on Windows).

**Phase 4 — POS / Billing ✅**
Billing counter (`/admin/billing`): Quick-sale/Products/Services/Packages tabs,
search, item cards, cart with qty steppers, manual customer name/phone,
percentage or Rs. bill discount, real-time subtotal/total/change, save or
80mm thermal print. APIs: `/api/bills` (server-side authoritative discount +
profit math, product stock decrement, auto id `BILL000001`), `/api/quicksale`
(max 12, live price resolution).

**Phase 5 — Customer website ✅ (booking flow pending)**
Public site chrome (Navbar with EN/SI switch + cart badge, Footer, conditional
AppFrame), animated Home (hero + how-to-get-service + CTAs), Products (search,
category chips, add-to-cart, lazy reveal), Services & Packages browse (+ package
details modal), Gallery, Contact, Cart → product pre-order checkout, and "Your
Bookings" tracking by phone. Public cost-stripped APIs + `/api/orders` (SMS to
admin) + `/api/track`. Cart persists in the browser (UI state only).
*Service/package online booking (slots + SMS to both) lands with the booking
engine below — for now those cards point the customer to call/WhatsApp.*

**Phase 6 — Booking engine ✅**
Real service/package booking: `/api/public/availability` (future-date +
holiday + taken-slot filtering), `/api/bookings` submit (all spec rules, SMS to
customer *and* admin, double-book protection), `/api/public/holidays`, and admin
`/api/holidays`. Book-now on the Services/Packages cards now opens a full flow —
details → future date → live slots → confirm → booking id.

**Phase 7 — Admin Orders + Summary ✅**
Orders page (`/admin/orders`): unified list of service/package bookings, product
pre-orders and POS bills; filter tabs; details view; status change → auto-SMS on
confirm (with 3 preset reject reasons + custom) → SMS on reject; print a bill;
remove (summaries stay in sync). Summary page: daily (32-day window) and monthly
tabs, per-item qty/income/profit, grand totals, a per-day income bar chart, and
print — all aggregated in Sri Lanka time.

**Phase 8 — Admin Calendar, Staff, Customers, Gallery ✅**
Calendar (`/admin/calendar`): month grid with today marker, off-day (holiday)
toggle, booking-count badges, and a per-day panel listing that day's bookings.
Staff (`/admin/staff`, admin-only): add/edit/remove admins & cashiers, set/reset
passwords, and grant cashiers extra page access (defaults + granted, admin-only
pages protected; can't remove the last admin or yourself). Customers
(`/admin/customers`): searchable directory. Gallery (`/admin/gallery`):
add/edit/remove photos with names (Cloudinary cleanup on delete).

**Phase 9 — Vercel cron + deployment + polish (next)**
`vercel.json` cron (e.g. auto-close stale pending bookings), SEO/metadata,
performance & responsive QA, deployment checklist.

**Phase 7 — Cron + polish**
Vercel cron, lazy-loading passes, SEO, performance, responsive QA.
```

---

## Change log

**Customer credit / installments**
- Customers are now **registered manually** by staff (no more auto-created
  records from orders/bookings). Fields: name, address (2 lines), phone
  (unique), ID card number. Search matches name, phone **and ID card**.
- Customers page shows **balance due**; opening a customer shows their credit
  bills, full **payment history**, a **record-payment** box (allocates the
  installment across outstanding bills oldest-first) and **print invoice**.
- Billing page has an **"Add to customer"** button: search a registered
  customer by name/phone, add the current cart to their account as a credit
  bill, and record an optional first installment. The initial receipt prints
  with Paid / Balance lines.
- Removing a customer is blocked while they still owe a balance.
