import { Router } from "express";
import { getMockData, resetMockData, updateMockData } from "../services/mock.service";

export const mockRouter = Router();

mockRouter.get("/data", (_req, res) => res.json(getMockData()));
mockRouter.patch("/data", (req, res) => res.json(updateMockData(req.body)));
mockRouter.post("/reset", (_req, res) => res.json(resetMockData()));
