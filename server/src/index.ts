import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import farmerRoutes from "./routes/farmers";
import milkRoutes from "./routes/milk";
import dashboardRoutes from "./routes/dashboard";
import reportRoutes from "./routes/reports";
import paymentRoutes from "./routes/payments";
import notifyRoutes from "./routes/notify";
import superAdminRoutes from "./routes/superadmin";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Allow all origins in production — restrict later if needed
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
            return callback(null, true);
        }
        return callback(null, true); // Allow all for now
    },
    credentials: true,
}));

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/farmers", farmerRoutes);
app.use("/api/milk", milkRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notify", notifyRoutes);
app.use("/api/superadmin", superAdminRoutes);

app.get("/api/health", (_req, res) => res.json({
    status: "ok",
    message: "Dairy API chal rahi hai 🐄",
    env: process.env.NODE_ENV,
}));

app.listen(PORT, () => console.log(`🐄 Dairy Server running on port ${PORT}`));
export default app;