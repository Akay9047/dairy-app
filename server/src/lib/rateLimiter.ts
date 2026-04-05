import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: "Bahut zyada login attempts. 15 minute baad try karein." },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
});

export const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: { error: "Request limit exceed ho gayi. Thoda ruko." },
    standardHeaders: true,
    legacyHeaders: false,
});

export const heavyLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { error: "Report limit exceed. 1 minute baad try karein." },
    standardHeaders: true,
    legacyHeaders: false,
});

export const setupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: { error: "Setup attempts limit exceed." },
    standardHeaders: true,
    legacyHeaders: false,
});