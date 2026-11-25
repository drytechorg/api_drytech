import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { router } from "./routes";
import { errorHandler } from "./middlewares/error";
import { env } from "./config/env";
import { swaggerSpec } from "./config/swagger";
export const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: env.corsOrigin === "*" ? true : env.corsOrigin }));
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
app.use("/api", router);
app.use(errorHandler);
