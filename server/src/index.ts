import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import morgan from "morgan";
import logger from "./lib/logger";
import { apiLimiter } from "./lib/rateLimiter";

import authRoutes from "./routes/auth";
import registerRoutes from "./routes/register";
import farmerRoutes from "./routes/farmers";
import milkRoutes from "./routes/milk";
import dashboardRoutes from "./routes/dashboard";
import reportRoutes from "./routes/reports";
import paymentRoutes from "./routes/payments";
import notifyRoutes from "./routes/notify";
import superAdminRoutes from "./routes/superadmin";
import rateSettingsRoutes from "./routes/rateSettings";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" }, contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({ origin: true, credentials: true, methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"], allowedHeaders: ["Content-Type","Authorization"] }));
app.use(morgan("combined", { stream: { write: (msg) => logger.info(msg.trim()) }, skip: (req) => req.url === "/api/health" }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use("/api", apiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/auth", registerRoutes);
app.use("/api/farmers", farmerRoutes);
app.use("/api/milk", milkRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notify", notifyRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/rate-settings", rateSettingsRoutes);

app.get("/api/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

app.use((_req, res) => res.status(404).json({ error: "Route nahi mila." }));
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error("Unhandled error:", err);
  res.status(500).json({ error: process.env.NODE_ENV === "production" ? "Server error." : err.message });
});

process.on("uncaughtException", (err) => { logger.error("Uncaught:", err); process.exit(1); });
process.on("unhandledRejection", (r) => { logger.error("Unhandled rejection:", r); });

app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
export default app;