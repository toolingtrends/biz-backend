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

## Small VPS (512MB) + PM2

`npm run build` (Prisma + `tsc`) can hit **JavaScript heap out of memory** on a 512MB droplet. Options:

1. **Build on a larger machine or CI**, then deploy only `dist/`, `node_modules/`, `package.json`, and `.env`.
2. **Or** on the server, before build: `export NODE_OPTIONS=--max-old-space-size=384` then `npm run build` (add **swap** if the kernel OOM-kills the process).
3. **Run** the API with a bounded heap so the OS keeps headroom: use the included PM2 file — `pm2 start ecosystem.config.cjs` (sets `--max-old-space-size=384` and `max_memory_restart`). After editing `.env`: `pm2 restart biz-backend --update-env`.

### SendGrid `EMAIL_VENDOR` on `/send-otp`

That code means SendGrid returned an error (bad API key, unverified sender, etc.). Check **server** logs for `[email.service] SendGrid HTTP`. To return a short `detail` in the JSON response temporarily, set `EXPOSE_EMAIL_ERRORS=true` in `.env` and restart PM2 with `--update-env` (disable after debugging).
