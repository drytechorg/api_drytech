import { Router } from "express";
import { login } from "../controllers/auth.controller";
import { authenticateAdmin } from "../middlewares/auth";

export const authRouter = Router();
authRouter.post("/login", login);
authRouter.get("/verify", authenticateAdmin, (_req, res) => res.json({ authenticated: true }));
