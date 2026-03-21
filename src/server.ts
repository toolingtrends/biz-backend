import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import routes from "./routes";
import { errorHandler } from "./middleware/error.middleware";
import { validateEnv } from "./config/env";
import { startDeactivationScheduler } from "./jobs/deactivation-scheduler";

validateEnv();

const app = express();

// Security & basic middleware
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

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth", authLimiter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// API routes
app.use("/api", routes);

// Global error handler (must be after all routes/middleware)
app.use(errorHandler);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend server listening on port ${PORT}`);
  startDeactivationScheduler();
});

