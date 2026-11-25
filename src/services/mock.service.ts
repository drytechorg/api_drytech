import { z } from "zod";

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
    id: string; deviceId: string; status: "IDLE" | "PREPARING" | "DRYING" | "PAUSED" | "COMPLETED" | "CANCELLED" | "ERROR";
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
      id: "mock-cycle-001", deviceId: "mock-device-001", status: "DRYING", startTime, endTime: null,
      initialWeight: 5.1, finalWeight: null, targetHumidity: 15, maximumTemperature: 54.1,
      energyConsumed: 1.25, lowHumidityReadings: 0, durationSeconds: 1080, energyPerKg: 0.245,
    },
    activeAlerts: [],
  };
}

let mockData = createInitialMockData();

function mergeDefined<T extends object>(current: T, updates: object): T {
  const result = { ...current };
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) Object.assign(result, { [key]: value });
  }
  return result;
}

export function getMockData(): MockData {
  return structuredClone(mockData);
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
  return getMockData();
}

export function resetMockData(): MockData {
  mockData = createInitialMockData();
  return getMockData();
}
