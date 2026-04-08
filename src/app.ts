import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import routes from "./routes";
import { errorHandler } from "./middleware/error.middleware";

/**
 * Comma-separated `CORS_ORIGIN`, e.g.
 * `https://your-app.vercel.app,http://localhost:3000`
 *
 * With `credentials: true`, browsers reject `Access-Control-Allow-Origin: *`. We reflect the
 * request `Origin` when it is allowed (or when `*` appears in the list for local testing).
 */
function corsAllowedOrigins(): { allowAny: boolean; origins: Set<string> } {
  const raw = process.env.CORS_ORIGIN?.trim();
  const fallback =
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001";
  const list = (raw && raw.length > 0 ? raw : fallback)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const allowAny = list.includes("*");
  const origins = new Set(list.filter((o) => o !== "*"));
  return { allowAny, origins };
}

/**
 * Builds the Express application (no listen, no env validation, no background jobs).
 * Used by the HTTP server and by integration tests.
 */
export function createApp(): express.Application {
  const app = express();

  app.use(helmet());
  app.use(express.json());

  const { allowAny, origins } = corsAllowedOrigins();
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          return callback(null, true);
        }
        if (allowAny || origins.has(origin)) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      credentials: true,
    })
  );
  app.use(compression());

  if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
  }

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/api/auth", authLimiter);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api", routes);
  app.use(errorHandler);

  return app;
}
