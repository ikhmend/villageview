import crypto from "node:crypto";
import compression from "compression";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import hpp from "hpp";
import { env } from "../../config/env.js";

export function applySecurityMiddleware(app) {
  const allowedOrigins = env.CLIENT_ORIGIN.split(",").map((origin) => origin.trim());
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use((req, res, next) => {
    req.id = req.get("x-request-id") || crypto.randomUUID();
    res.setHeader("x-request-id", req.id);
    next();
  });
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Origin is not allowed by CORS"));
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
  }));
  app.use(compression());
  app.use(rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.RATE_LIMIT_MAX,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }));
}
export function applyParameterPollutionProtection(app) {
  app.use(hpp());
}
