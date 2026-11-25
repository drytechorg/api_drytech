import { z } from "zod";
import { randomUUID } from "crypto";
import { AppError } from "../utils/http";

const mockSchema = z
  .object({
    device: z
      .object({
        id: z.string().optional(),
        name: z.string().optional(),
        status: z.enum(["ONLINE", "OFFLINE", "MAINTENANCE", "ERROR"]).optional(),
        lastSeen: z.string().nullable().optional(),
      })
      .strict()
      .optional(),
    telemetry: z
      .object({
        id: z.string().optional(),
        deviceId: z.string().optional(),
        cycleId: z.string().nullable().optional(),
        temperature: z.number().optional(),
        humidity: z.number().optional(),
        weight: z.number().optional(),
        doorOpen: z.boolean().optional(),
        motorOn: z.boolean().optional(),
        heaterOn: z.boolean().optional(),
        fanOn: z.boolean().optional(),
        current: z.number().optional(),
        voltage: z.number().optional(),
        energyConsumption: z.number().optional(),
        timestamp: z.string().optional(),
      })
      .strict()
      .optional(),
    cycle: z
      .object({
        id: z.string().optional(),
        deviceId: z.string().optional(),
        foodName: z.string().optional(),
        targetTemperature: z.number().optional(),
        plannedDurationSeconds: z.number().int().positive().optional(),
        status: z.enum(["IDLE", "PREPARING", "DRYING", "PAUSED", "COMPLETED", "CANCELLED", "ERROR"]).optional(),
        startTime: z.string().optional(),
        endTime: z.string().nullable().optional(),
        initialWeight: z.number().optional(),
        finalWeight: z.number().nullable().optional(),
        targetHumidity: z.number().optional(),
        maximumTemperature: z.number().optional(),
        energyConsumed: z.number().optional(),
        lowHumidityReadings: z.number().optional(),
        durationSeconds: z.number().optional(),
        energyPerKg: z.number().nullable().optional(),
      })
      .strict()
      .nullable()
      .optional(),
    activeAlerts: z
      .array(
        z.object({
          id: z.string(),
          deviceId: z.string(),
          cycleId: z.string().nullable(),
          type: z.string(),
          severity: z.enum(["INFO", "WARNING", "CRITICAL"]),
          message: z.string(),
          value: z.number().nullable(),
          acknowledged: z.boolean(),
          createdAt: z.string(),
        }),
      )
      .optional(),
  })
  .strict();

type MockData = {
  device: { id: string; name: string; status: "ONLINE" | "OFFLINE" | "MAINTENANCE" | "ERROR"; lastSeen: string };
  telemetry: {
    id: string; deviceId: string; cycleId: string | null; temperature: number; humidity: number; weight: number;
    doorOpen: boolean; motorOn: boolean; heaterOn: boolean; fanOn: boolean; current: number; voltage: number;
    energyConsumption: number; timestamp: string;
  };
  cycle: null | {
    id: string; deviceId: string; foodName: string; targetTemperature: number; plannedDurationSeconds: number;
    status: "IDLE" | "PREPARING" | "DRYING" | "PAUSED" | "COMPLETED" | "CANCELLED" | "ERROR";
    startTime: string; endTime: string | null; initialWeight: number; finalWeight: number | null;
    targetHumidity: number; maximumTemperature: number; energyConsumed: number; lowHumidityReadings: number;
    durationSeconds: number; energyPerKg: number | null;
  };
  activeAlerts: Array<{
    id: string; deviceId: string; cycleId: string | null; type: string; severity: "INFO" | "WARNING" | "CRITICAL";
    message: string; value: number | null; acknowledged: boolean; createdAt: string;
  }>;
};

function createInitialMockData(): MockData {
  const now = new Date();
  const timestamp = now.toISOString();
  const startTime = new Date(now.getTime() - 18 * 60 * 1000).toISOString();
  return {
    device: { id: "mock-device-001", name: "Secadora de demonstração", status: "ONLINE", lastSeen: timestamp },
    telemetry: {
      id: "mock-telemetry-001", deviceId: "mock-device-001", cycleId: "mock-cycle-001", temperature: 52.4,
      humidity: 31.8, weight: 4.2, doorOpen: false, motorOn: true, heaterOn: true, fanOn: true,
      current: 4.2, voltage: 220, energyConsumption: 1.25, timestamp,
    },
    cycle: {
      id: "mock-cycle-001", deviceId: "mock-device-001", foodName: "Demonstração", targetTemperature: 55,
      plannedDurationSeconds: 3600, status: "DRYING", startTime, endTime: null,
      initialWeight: 5.1, finalWeight: null, targetHumidity: 15, maximumTemperature: 54.1,
      energyConsumed: 1.25, lowHumidityReadings: 0, durationSeconds: 1080, energyPerKg: 0.245,
    },
    activeAlerts: [],
  };
}

let mockData = createInitialMockData();
const mockSubscribers = new Set<(data: MockData) => void>();

function publishMockData(): void {
  const current = getMockData();
  for (const subscriber of mockSubscribers) subscriber(current);
}

export function subscribeMockData(subscriber: (data: MockData) => void): () => void {
  mockSubscribers.add(subscriber);
  subscriber(getMockData());
  return () => mockSubscribers.delete(subscriber);
}

function mergeDefined<T extends object>(current: T, updates: object): T {
  const result = { ...current };
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) Object.assign(result, { [key]: value });
  }
  return result;
}

export function getMockData(): MockData {
  const snapshot = structuredClone(mockData);
  if (snapshot.cycle?.status === "DRYING") {
    const elapsed = Math.floor(
      (Date.now() - new Date(snapshot.cycle.startTime).getTime()) / 1000,
    );
    snapshot.cycle.durationSeconds = Math.max(0, elapsed);
  }
  return snapshot;
}

const mockCycleInputSchema = z.object({
  foodName: z.string().trim().min(1).max(100),
  initialWeight: z.number().positive().max(100),
  targetTemperature: z.number().min(35).max(80),
  plannedDurationSeconds: z.number().int().positive().max(86_400),
}).strict();

const mockCycleUpdateSchema = z.object({
  foodName: z.string().trim().min(1).max(100).optional(),
  initialWeight: z.number().positive().max(100).optional(),
  targetTemperature: z.number().min(35).max(80).optional(),
  plannedDurationSeconds: z.number().int().positive().max(86_400).optional(),
  status: z.enum(["PREPARING", "DRYING", "PAUSED", "COMPLETED", "CANCELLED", "ERROR"]).optional(),
}).strict().refine((patch) => Object.keys(patch).length > 0, "Informe ao menos um campo para atualizar");

export function createMockCycle(input: unknown): MockData {
  const values = mockCycleInputSchema.parse(input);
  if (mockData.device.status !== "ONLINE") {
    throw new AppError(409, "A secadora mock está indisponível");
  }

  const now = new Date().toISOString();
  const cycleId = `mock-cycle-${randomUUID()}`;
  mockData = {
    ...mockData,
    cycle: {
      id: cycleId,
      deviceId: mockData.device.id,
      foodName: values.foodName,
      targetTemperature: values.targetTemperature,
      plannedDurationSeconds: values.plannedDurationSeconds,
      status: "DRYING",
      startTime: now,
      endTime: null,
      initialWeight: values.initialWeight,
      finalWeight: null,
      targetHumidity: 15,
      maximumTemperature: values.targetTemperature,
      energyConsumed: 0,
      lowHumidityReadings: 0,
      durationSeconds: 0,
      energyPerKg: null,
    },
    telemetry: {
      ...mockData.telemetry,
      cycleId,
      temperature: values.targetTemperature,
      weight: values.initialWeight,
      motorOn: true,
      heaterOn: true,
      fanOn: true,
      timestamp: now,
    },
  };
  publishMockData();
  return getMockData();
}

export function updateMockCycle(input: unknown): MockData {
  const patch = mockCycleUpdateSchema.parse(input);
  const current = mockData.cycle;
  if (!current) throw new AppError(404, "Não há ciclo mock para editar");

  const now = new Date();
  const nowIso = now.toISOString();
  const currentElapsed = current.status === "PAUSED"
    ? current.durationSeconds
    : Math.max(0, Math.floor((now.getTime() - new Date(current.startTime).getTime()) / 1000));
  const cyclePatch: Record<string, unknown> = { ...patch };

  if (patch.targetTemperature !== undefined) {
    cyclePatch.maximumTemperature = patch.targetTemperature;
  }
  if (patch.status === "PAUSED") {
    cyclePatch.durationSeconds = currentElapsed;
  }
  if (patch.status === "DRYING" && current.status === "PAUSED") {
    cyclePatch.startTime = new Date(now.getTime() - current.durationSeconds * 1000).toISOString();
  }
  if (patch.status === "COMPLETED" || patch.status === "CANCELLED" || patch.status === "ERROR") {
    cyclePatch.endTime = nowIso;
    cyclePatch.durationSeconds = currentElapsed;
  }

  mockData = {
    ...mockData,
    cycle: mergeDefined(current, cyclePatch),
    telemetry: {
      ...mockData.telemetry,
      ...(patch.initialWeight !== undefined && { weight: patch.initialWeight }),
      ...(patch.targetTemperature !== undefined && { temperature: patch.targetTemperature }),
      timestamp: nowIso,
    },
  };
  publishMockData();
  return getMockData();
}

export function deleteMockCycle(cycleId: string): MockData {
  const current = mockData.cycle;
  if (!current || current.id !== cycleId) {
    throw new AppError(404, "Ciclo não encontrado");
  }

  const timestamp = new Date().toISOString();
  mockData = {
    ...mockData,
    cycle: null,
    telemetry: {
      ...mockData.telemetry,
      cycleId: null,
      motorOn: false,
      heaterOn: false,
      fanOn: false,
      timestamp,
    },
  };
  publishMockData();
  return getMockData();
}

export function updateMockData(input: unknown): MockData {
  const patch = mockSchema.parse(input);
  mockData = {
    ...mockData,
    ...(patch.device && { device: mergeDefined(mockData.device, patch.device) }),
    ...(patch.telemetry && { telemetry: mergeDefined(mockData.telemetry, patch.telemetry) }),
    ...(patch.cycle !== undefined && {
      cycle: patch.cycle === null ? null : mockData.cycle ? mergeDefined(mockData.cycle, patch.cycle) : null,
    }),
    ...(patch.activeAlerts && { activeAlerts: patch.activeAlerts }),
  };
  publishMockData();
  return getMockData();
}

export function resetMockData(): MockData {
  mockData = createInitialMockData();
  publishMockData();
  return getMockData();
}
