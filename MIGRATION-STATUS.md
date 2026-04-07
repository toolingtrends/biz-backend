# Backend Migration – Status, Changes Needed & Remaining

**Database:** Backend uses **PostgreSQL (Neon)**. MongoDB and Mongoose have been removed. Prisma schema: `backend/prisma/schema.prisma`. OTP is stored in Prisma model `Otp`.

## What’s done

### Core backend
- Express + TypeScript server, CORS, JSON, morgan
- Prisma config (singleton), Mongoose for OTP
- Cloudinary service (uploadImage, uploadDocument, uploadRaw, deleteAsset, extractPublicId)
- Email service (sendOtpEmail, sendBadgeEmail, sendVerificationEmail)
- Unified JWT auth: AuthService (login, refresh, verify), middleware (requireUser, requireAdmin, requireSuperAdmin)

### Auth (backend)
- **OTP:** `POST /api/auth/send-otp`, `POST /api/auth/verify-otp`
- **JWT:** `POST /api/auth/login` (email + password → user + accessToken + refreshToken), `POST /api/auth/refresh` (refreshToken → new tokens)
- **JWT middleware:** requireUser, requireAdmin, requireSuperAdmin on write routes

### Events (read + write)
- **Read:** GET /events, /events/:id, /events/featured, /events/stats, /search
- **Write:** POST/DELETE/GET /events/:id/save, GET/POST /events/:id/promotions
- **Admin create:** POST /admin/events
- **Organizer update/delete:** PUT/DELETE /organizers/:id/events/:eventId

### Organizers (read + event write)
- **Read:** GET /organizers, /organizers/:id, /organizers/:id/analytics, /organizers/:id/total-attendees
- **Write:** PUT/DELETE /organizers/:id/events/:eventId

### Exhibitors, Venues, Speakers (read only)
- **Exhibitors:** GET /exhibitors, /exhibitors/:id, /exhibitors/:id/analytics, /exhibitors/:exhibitorId/events
- **Venues:** GET /venues, /venues/:id/events
- **Speakers:** GET /speakers, /speakers/:id, /speakers/:id/events

---

## Changes needed (to use the backend)

### 1. Backend: dependencies & schema
- Run `npm install` in `backend/` so Express/cors/morgan (and types) are installed; fix any remaining TypeScript errors (e.g. in organizers.service).
- Ensure `backend/prisma/schema.prisma` includes **all** models used by migrated routes (Event, SavedEvent, Promotion, TicketType, ExhibitionSpace, SpeakerSession, ExhibitorBooth, AdminLog, User, etc.). If it was truncated, copy the full schema from root `prisma/schema.prisma` and run `npx prisma generate` in `backend/`.

### 2. Frontend: point to backend API
- **Option A – Env base URL:** Add `NEXT_PUBLIC_API_URL=http://localhost:4000` (or your backend URL). For migrated routes, replace `fetch('/api/...')` with `fetch(\`${process.env.NEXT_PUBLIC_API_URL}/api/...\`)` and send `Authorization: Bearer <accessToken>` where the backend expects auth.
- **Option B – Next.js rewrite:** In `next.config.js`, add a rewrite so `/api/events/*`, `/api/organizers/*`, `/api/auth/send-otp`, `/api/auth/verify-otp`, `/api/admin/events` (and optionally other migrated paths) proxy to the backend (e.g. `http://localhost:4000`). Then existing relative `/api/...` calls hit the backend without changing every call.
- **Auth:** For routes that use `requireUser`/`requireAdmin`, the frontend must send the JWT (e.g. from login/refresh) in the `Authorization` header. That implies either (1) switching those flows from NextAuth session to JWT, or (2) keeping NextAuth for UI state and adding a small adapter that gets a JWT (e.g. via a Next.js API route that uses the session and calls the backend to get tokens) and attaches it to requests to the backend.

### 3. Frontend: OTP and create-event URLs
- **OTP:** Frontend currently uses `/api/send-otp` and `/api/verify-otp`. Backend has `/api/auth/send-otp` and `/api/auth/verify-otp`. Either update frontend to `/api/auth/send-otp` and `/api/auth/verify-otp`, or add backend routes that alias the same handlers at `/send-otp` and `/verify-otp`.
- **Create event:** Organizer UI may call `POST /api/organizers/:id/events` (create). Backend currently has **admin** create at `POST /api/admin/events`. If organizers should create events too, add `POST /api/organizers/:id/events` (requireUser, organizer check) that creates an event with that organizerId.

---

## Remaining migration (by area)

### Events (small gaps)
- Event sub-resources: attendees, leads, reviews, exhibitors list, brochure, venue, layout, banners, followers, exhibition-spaces, etc. – many still only in Next.js.

### Organizers (write)
- Other organizer routes: leads, reviews, messages, subscription, export, etc. – still in Next.js.

### Exhibitors (write)
- Exhibitor write routes (create/update/delete, promotions, reviews, products, leads, analytics updates) – not migrated.

### Venues (write)
- Venue write routes – not migrated.

### Speakers (write)
- Speaker write routes – not migrated.

### Admin (large surface)
- **Events:** GET list, GET/PUT/DELETE /admin/events/:id, approve/reject/pending/approved/rejected, stats, verify, settings/security/events.
- **Organizers, exhibitors, venues, speakers:** Admin CRUD, status, feedback, export, promotions, etc.
- **Settings:** security, backup, language, modules, integrations (travel, payments, communication).
- **Other:** dashboard, notifications, visitors, cities, countries, marketing, financial, support tickets, admin-notes, FAQs, dashboard-content, help-support, banners, upload – all still in Next.js.

### Auth (frontend)
- NextAuth routes (`/api/auth/[...nextauth]`), forgot-password, reset-password, verify-reset-token, super-admin signin/verify-token, register – still in Next.js. Backend has OTP + JWT service; no register or password-reset flows yet.

### Uploads
- **Cloudinary:** Backend has the service; no HTTP routes like `/api/upload/cloudinary` or `/api/brochure/upload` yet. Frontend still uses Next.js API for uploads.

### Other domains (not migrated)
- Users (profile, saved-events, connections, notifications, settings).
- Follow, materials, products, legal-documents, broadcasts, appointments, venue-bookings, venue-appointments, support-tickets, conferences, content/banners, FAQs, help-support, etc.

---

## Suggested order of next steps

1. **Backend:** Fix deps (`npm install`) and Prisma schema so backend builds and runs. Login/refresh are implemented at `POST /api/auth/login` and `POST /api/auth/refresh`.
2. **Frontend:** Use env + rewrite (or base URL) so migrated endpoints hit the backend; send JWT for protected routes (wire login/refresh in the UI or via adapter).
3. **Frontend:** Point OTP to `/api/auth/send-otp` and `/api/auth/verify-otp` (or add backend aliases at `/send-otp`, `/verify-otp`).
4. **Then:** Migrate domain-by-domain (e.g. exhibitors write, then venues, then speakers, then admin event management, then other admin and upload routes).

---

## Quick reference – backend API base

If backend runs at `http://localhost:4000`:

| Method | Path | Auth | Purpose |
|--------|------|------|--------|
| GET | /api/events | - | List events |
| GET | /api/events/featured | - | Featured events |
| GET | /api/events/stats | - | Event stats |
| GET | /api/events/:id | - | Event by id/slug |
| POST | /api/events/:id/save | User JWT | Save event |
| DELETE | /api/events/:id/save | User JWT | Unsave event |
| GET | /api/events/:id/save | User JWT | Check saved |
| GET | /api/events/:id/promotions | - | List promotions |
| POST | /api/events/:id/promotions | User JWT | Create promotion |
| GET | /api/search | - | Global search |
| POST | /api/admin/events | Admin JWT | Create event (admin) |
| GET | /api/organizers | - | List organizers |
| GET | /api/organizers/:id | - | Organizer by id |
| GET | /api/organizers/:id/analytics | - | Organizer analytics |
| GET | /api/organizers/:id/total-attendees | - | Total attendees |
| PUT | /api/organizers/:id/events/:eventId | User JWT | Update event |
| DELETE | /api/organizers/:id/events/:eventId | User JWT | Delete event |
| GET | /api/exhibitors, /api/exhibitors/:id, ... | - | Exhibitors read |
| GET | /api/venues, /api/venues/:id/events | - | Venues read |
| GET | /api/speakers, /api/speakers/:id, ... | - | Speakers read |
| POST | /api/auth/send-otp | - | Send OTP |
| POST | /api/auth/verify-otp | - | Verify OTP |
| POST | /api/auth/login | - | Login (email, password) → user + tokens |
| POST | /api/auth/refresh | - | Refresh tokens |
