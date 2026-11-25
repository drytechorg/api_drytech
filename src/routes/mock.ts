import { Router } from "express";
import { authenticateAdmin } from "../middlewares/auth";
import { createMockCycle, deleteMockCycle, getMockData, resetMockData, subscribeMockData, updateMockCycle, updateMockData } from "../services/mock.service";

export const mockRouter = Router();

mockRouter.get("/data", (_req, res) => res.json(getMockData()));
mockRouter.post("/cycle", authenticateAdmin, (req, res) => res.status(201).json(createMockCycle(req.body)));
mockRouter.patch("/cycle", authenticateAdmin, (req, res) => res.json(updateMockCycle(req.body)));
mockRouter.delete("/cycle/:cycleId", authenticateAdmin, (req, res) => {
  const cycleId = Array.isArray(req.params.cycleId) ? req.params.cycleId[0] : req.params.cycleId;
  res.json(deleteMockCycle(cycleId));
});
mockRouter.get("/events", (req, res) => {
  res.status(200);
  res.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
  res.flushHeaders();
  const unsubscribe = subscribeMockData((data) => {
    res.write(`event: mock-data\ndata: ${JSON.stringify(data)}\n\n`);
  });
  const keepAlive = setInterval(() => res.write(": keep-alive\n\n"), 20_000);
  req.on("close", () => {
    clearInterval(keepAlive);
    unsubscribe();
  });
});
mockRouter.patch("/data", authenticateAdmin, (req, res) => res.json(updateMockData(req.body)));
mockRouter.post("/reset", authenticateAdmin, (_req, res) => res.json(resetMockData()));
