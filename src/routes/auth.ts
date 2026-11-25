import { Router } from "express";
import { login, mockLogin } from "../controllers/auth.controller";
import { authenticateAdmin } from "../middlewares/auth";

export const authRouter = Router();
authRouter.post("/login", login);
authRouter.post("/mock", mockLogin);
authRouter.get("/verify", authenticateAdmin, (_req, res) => res.json({ authenticated: true }));
