import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import routes from "./routes";
import { errorHandler } from "./middleware/error.middleware";

/**
 * Builds the Express application (no listen, no env validation, no background jobs).
 * Used by the HTTP server and by integration tests.
 */
export function createApp(): express.Application {
  const app = express();

  app.use(helmet());
  app.use(express.json());
  app.use(
    cors({
      origin: (process.env.CORS_ORIGIN || "*").split(","),
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
