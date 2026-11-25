import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import {
  telemetrySchema,
  deviceSchema,
  cycleSchema,
  statusSchema,
} from "../schemas";
import { asyncHandler, AppError } from "../utils/http";
import { processTelemetry } from "../services/telemetry.service";
import { assertCycleTransition } from "../services/dryingCycle.service";
import { createHash } from "crypto";
import { env } from "../config/env";
import { getMockData } from "../services/mock.service";
export const telemetry = asyncHandler(async (req: Request, res: Response) =>
  res.json(
    await processTelemetry(
      String(req.params.deviceId),
      telemetrySchema.parse(req.body),
    ),
  ),
);
export const heartbeat = asyncHandler(async (req: Request, res: Response) => {
  await prisma.device.update({
    where: { id: String(req.params.deviceId) },
    data: { lastSeen: new Date(), status: "ONLINE" },
  });
  res.json({ success: true, nextTelemetryIn: env.telemetryInterval });
});
export const iotStatus = asyncHandler(async (req: Request, res: Response) => {
  const d = await prisma.device.findUnique({
    where: { id: String(req.params.deviceId) },
    include: {
      telemetry: { take: 1, orderBy: { timestamp: "desc" } },
      cycles: {
        where: { status: { in: ["PREPARING", "DRYING", "PAUSED"] } },
        take: 1,
      },
    },
  });
  if (!d) throw new AppError(404, "Device not found");
  res.json({
    device: d,
    telemetry: d.telemetry[0] ?? null,
    cycle: d.cycles[0] ?? null,
  });
});
export const createDevice = asyncHandler(
  async (req: Request, res: Response) => {
    const d = deviceSchema.parse(req.body);
    const device = await prisma.device.create({
      data: {
        ...d,
        apiKeyHash: createHash("sha256").update(d.apiKey).digest("hex"),
      },
    });
    res.status(201).json({ ...device, apiKeyHash: undefined });
  },
);
export const listDevices = asyncHandler(async (_req: Request, res: Response) =>
  res.json(await prisma.device.findMany({ orderBy: { createdAt: "desc" } })),
);
export const getDevice = asyncHandler(async (req: Request, res: Response) => {
  const d = await prisma.device.findUnique({
    where: { id: String(req.params.id) },
  });
  if (!d) throw new AppError(404, "Device not found");
  res.json(d);
});
export const patchDevice = asyncHandler(async (req: Request, res: Response) =>
  res.json(
    await prisma.device.update({
      where: { id: String(req.params.id) },
      data: deviceSchema.partial().omit({ apiKey: true }).parse(req.body),
    }),
  ),
);
export const createCycle = asyncHandler(async (req: Request, res: Response) => {
  const d = cycleSchema.parse(req.body);
  res
    .status(201)
    .json(
      await prisma.dryingCycle.create({
        data: { ...d, targetHumidity: d.targetHumidity ?? env.targetHumidity },
      }),
    );
});
export const listCycles = asyncHandler(async (req: Request, res: Response) =>
  res.json(
    await prisma.dryingCycle.findMany({
      where: req.query.deviceId ? { deviceId: String(req.query.deviceId) } : {},
      orderBy: { createdAt: "desc" },
    }),
  ),
);
export const getCycle = asyncHandler(async (req: Request, res: Response) => {
  const c = await prisma.dryingCycle.findUnique({
    where: { id: String(req.params.id) },
  });
  if (!c) throw new AppError(404, "Cycle not found");
  res.json(c);
});
export const setCycleStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const c = await prisma.dryingCycle.findUnique({
      where: { id: String(req.params.id) },
    });
    if (!c) throw new AppError(404, "Cycle not found");
    const { status } = statusSchema.parse(req.body);
    assertCycleTransition(c.status, status);
    res.json(
      await prisma.dryingCycle.update({
        where: { id: c.id },
        data: {
          status,
          endTime: ["COMPLETED", "CANCELLED", "ERROR"].includes(status)
            ? new Date()
            : undefined,
        },
      }),
    );
  },
);
export const cancelCycle = asyncHandler(async (req: Request, res: Response) => {
  const c = await prisma.dryingCycle.findUnique({
    where: { id: String(req.params.id) },
  });
  if (!c) throw new AppError(404, "Cycle not found");
  assertCycleTransition(c.status, "CANCELLED");
  res.json(
    await prisma.dryingCycle.update({
      where: { id: c.id },
      data: { status: "CANCELLED", endTime: new Date() },
    }),
  );
});
export const telemetryHistory = asyncHandler(
  async (req: Request, res: Response) =>
    res.json(
      await prisma.telemetry.findMany({
        where: { deviceId: String(req.params.deviceId) },
        orderBy: { timestamp: "desc" },
        take: Math.min(Number(req.query.limit ?? 100), 500),
      }),
    ),
);
export const latestTelemetry = asyncHandler(
  async (req: Request, res: Response) =>
    res.json(
      await prisma.telemetry.findFirst({
        where: { deviceId: String(req.params.deviceId) },
        orderBy: { timestamp: "desc" },
      }),
    ),
);
export const alerts = asyncHandler(async (req: Request, res: Response) =>
  res.json(
    await prisma.alert.findMany({
      where: {
        deviceId: String(req.params.deviceId),
        ...(req.query.active === "true" ? { acknowledged: false } : {}),
      },
      orderBy: { createdAt: "desc" },
    }),
  ),
);
export const acknowledge = asyncHandler(async (req: Request, res: Response) =>
  res.json(
    await prisma.alert.update({
      where: { id: String(req.params.id) },
      data: { acknowledged: true },
    }),
  ),
);
export const dashboard = asyncHandler(async (req: Request, res: Response) => {
  if (env.mockMode) return res.json(getMockData());

  const device = await prisma.device.findUnique({
    where: { id: String(req.params.deviceId) },
    include: {
      telemetry: { take: 1, orderBy: { timestamp: "desc" } },
      cycles: {
        where: { status: { in: ["PREPARING", "DRYING", "PAUSED"] } },
        take: 1,
      },
      alerts: {
        where: { acknowledged: false },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!device) throw new AppError(404, "Device not found");
  const c = device.cycles[0],
    t = device.telemetry[0];
  res.json({
    device: {
      id: device.id,
      name: device.name,
      status: device.status,
      lastSeen: device.lastSeen,
    },
    telemetry: t ?? null,
    cycle: c
      ? {
          ...c,
          durationSeconds: Math.floor(
            (Date.now() - c.startTime.getTime()) / 1000,
          ),
          energyPerKg: c.initialWeight
            ? c.energyConsumed / c.initialWeight
            : null,
        }
      : null,
    activeAlerts: device.alerts,
  });
});
