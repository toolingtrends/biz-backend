# Biz Backend (PostgreSQL / Neon)

Express + TypeScript API. Uses **PostgreSQL** (Neon) and Prisma. No MongoDB/Mongoose.

## Setup

1. **Install dependencies** (from this folder)

   ```bash
   cd biz-backend
   npm install
   ```

2. **Environment**
   - Copy `.env.example` to `.env`
   - Set `DATABASE_URL` to your Neon PostgreSQL connection string (see `.env.example`).
   - **CORS (required for Vercel + browser login):** set `CORS_ORIGIN` to a comma-separated list of allowed web origins (no spaces). Example for production + local dev:

     `CORS_ORIGIN=https://your-app.vercel.app,http://localhost:3000`

     The API uses `credentials: true`, so `*` is not valid for browser requests; your frontend’s exact `https://…` origin must be listed.

   - **Vercel previews:** each deployment gets a different `*.vercel.app` URL. Either add every URL to `CORS_ORIGIN`, or set **`CORS_ALLOW_VERCEL_APP=true`** (allows all `https://*.vercel.app` origins — still requires JWT for protected routes).

   - **Email (OTP, password reset):** On many VPS providers, **outbound SMTP to Gmail (ports 465/587) is blocked**, which causes long timeouts. Prefer **SendGrid** over HTTPS (port 443):
     - `SENDGRID_API_KEY` — API key from SendGrid.
     - `SENDGRID_FROM_EMAIL` — sender address **verified** in SendGrid (single sender or domain authentication).
     - If unset, the app falls back to **Gmail SMTP** using `EMAIL_USER` / `EMAIL_PASS` (app password).

3. **Database**
   - Create tables (no migrations): `npx prisma db push`
   - Or use migrations: `npx prisma migrate dev --name init`

4. **Generate Prisma Client**

   ```bash
   npx prisma generate
   ```

5. **Run**

   ```bash
   npm run dev
   ```

   API: `http://localhost:4000` (or `PORT` from env).

## DB: PostgreSQL (Neon)

- Schema: `prisma/schema.prisma`
- All IDs are `uuid()`; no MongoDB ObjectId.
- OTP is stored in Prisma model `Otp` (table `otps`), not Mongoose.

## Testing

API integration tests use **Jest** + **Supertest**. Prisma is replaced with a manual mock (`src/config/__mocks__/prisma.ts`), so tests do not open a real database.

```bash
npm test
npm run test:watch
npm run test:coverage
```

## Commands

| Command | Description |
|--------|-------------|
| `npm run dev` | Start dev server (ts-node) |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled app |
| `npm test` | Jest + Supertest (no real DB) |
| `npm run db:generate` | Prisma generate |
| `npm run db:push` | Push schema to DB (no migration history) |
| `npm run db:migrate` | Run migrations |
