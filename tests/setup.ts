/**
 * Runs once per test file, after the test framework is installed.
 * Ensures required env keys exist so optional code paths do not read undefined.
 * Real validation (`validateEnv`) only runs in `server.ts`, not in `createApp()`.
 */
process.env.NODE_ENV = "test";

const placeholder = "test-secret-min-32-chars-long!!";

process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://localhost:5432/biz_test?schema=public";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? placeholder;
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? placeholder;
process.env.CLOUDINARY_CLOUD_NAME =
  process.env.CLOUDINARY_CLOUD_NAME ?? "test-cloud";
process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY ?? "test-key";
process.env.CLOUDINARY_API_SECRET =
  process.env.CLOUDINARY_API_SECRET ?? "test-secret";
