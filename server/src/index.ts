import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import morgan from "morgan";
import logger from "./lib/logger";
import { apiLimiter } from "./lib/rateLimiter";

import authRoutes from "./routes/auth";
import farmerRoutes from "./routes/farmers";
import milkRoutes from "./routes/milk";
import dashboardRoutes from "./routes/dashboard";
import reportRoutes from "./routes/reports";
import paymentRoutes from "./routes/payments";
import notifyRoutes from "./routes/notify";
import superAdminRoutes from "./routes/superadmin";

dotenv.config();

// Validate critical env vars
const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET"];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  logger.error(`FATAL: Missing env vars: ${missingVars.join(", ")}`);
  if (process.env.NODE_ENV === "production") process.exit(1);
}

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  logger.error("FATAL: JWT_SECRET must be at least 32 characters!");
  if (process.env.NODE_ENV === "production") process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 4000;

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // API server, not serving HTML
}));

// Compression
app.use(compression());

// CORS
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
      return callback(null, true);
    }
    return callback(null, true); // Allow all for now — restrict after domain is set
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Request logging
app.use(morgan("combined", {
  stream: { write: (msg) => logger.info(msg.trim()) },
  skip: (req) => req.url === "/api/health",
}));

// Body parsing with size limit
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Global rate limit
app.use("/api", apiLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/farmers", farmerRoutes);
app.use("/api/milk", milkRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notify", notifyRoutes);
app.use("/api/superadmin", superAdminRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Route nahi mila." });
});

// Global error handler — no stack traces in production
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error("Unhandled error:", err);
  res.status(500).json({
    error: process.env.NODE_ENV === "production"
      ? "Server error. Baad mein try karein."
      : err.message,
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection:", reason);
});

app.listen(PORT, () => {
  logger.info(`Dairy Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
});

export default app;