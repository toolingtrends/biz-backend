/**
 * Load `.env` before any other module reads `process.env`.
 * PM2 does not load `.env` by default; this matches `npm run dev` behavior.
 */
import path from "path";
import { config } from "dotenv";

config({ path: path.resolve(process.cwd(), ".env") });
