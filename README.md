# Biz Backend (PostgreSQL / Neon)

Express + TypeScript API. Uses **PostgreSQL** (Neon) and Prisma. No MongoDB/Mongoose.

## Setup

1. **Install dependencies** (from monorepo root, recommended)
   ```bash
   pnpm install
   ```
   Or from this folder: `cd biz-backend && pnpm install`

2. **Environment**
   - Copy `.env.example` to `.env`
   - Set `DATABASE_URL` to your Neon PostgreSQL connection string (see `.env.example`).

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

- Schema: `biz-backend/prisma/schema.prisma`
- All IDs are `uuid()`; no MongoDB ObjectId.
- OTP is stored in Prisma model `Otp` (table `otps`), not Mongoose.

## Testing

API integration tests use **Jest** + **Supertest**. Prisma is replaced with a manual mock (`src/config/__mocks__/prisma.ts`), so tests do not open a real database.

```bash
npm test
npm run test:watch
npm run test:coverage
```

In a pnpm monorepo, run `pnpm prisma generate` from **this folder** after install so `@prisma/client` matches this schema (the hoisted client may otherwise reflect another workspace).

## Commands

| Command | Description |
|--------|-------------|
| `pnpm dev` | Start dev server (ts-node) |
| `pnpm build` | Compile TypeScript |
| `pnpm start` | Run compiled app |
| `npm test` | Jest + Supertest (no real DB) |
| `pnpm db:generate` | Prisma generate |
| `pnpm db:push` | Push schema to DB (no migration history) |
| `pnpm db:migrate` | Run migrations |
