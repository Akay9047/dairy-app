import { apiLimiter } from "./lib/rateLimiter";

// Login — strict limit
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // max 10 attempts per 15 min
    message: { error: "Bahut zyada login attempts. 15 minute baad try karein." },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
});

// API general limit
export const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: { error: "Request limit exceed ho gayi. Thoda ruko." },
    standardHeaders: true,
    legacyHeaders: false,
});

// Heavy operations — reports, CSV
export const heavyLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { error: "Report limit exceed. 1 minute baad try karein." },
    standardHeaders: true,
    legacyHeaders: false,
});

// Setup endpoint — very strict
export const setupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: { error: "Setup attempts limit exceed." },
    standardHeaders: true,
    legacyHeaders: false,
});