import express from "express";
import { resolve } from "path";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { router } from "./routes";
import { errorHandler } from "./middlewares/error";
import { env } from "./config/env";
import { swaggerSpec } from "./config/swagger";
import { mockRouter } from "./routes/mock";
import { authRouter } from "./routes/auth";
export const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes("*") || env.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    allowedHeaders: ["Content-Type", "Authorization", "x-device-api-key"],
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  }),
);
app.use(
  rateLimit({
    windowMs: 60_000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.use(express.json({ limit: "32kb" }));
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.get("/api/docs.json", (_req, res) => res.json(swaggerSpec));
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/auth", authRouter);
if (env.mockMode) {
  app.use("/admin/assets", express.static(resolve(__dirname, "../web")));
  app.get("/admin", (_req, res) => res.sendFile(resolve(__dirname, "../web/admin.html")));
  app.use("/api/mock", mockRouter);
}
app.use("/api", router);
app.use(errorHandler);
