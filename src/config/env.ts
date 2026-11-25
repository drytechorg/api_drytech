import "dotenv/config";
const num = (key: string, fallback: number) => {
  const n = Number(process.env[key] ?? fallback);
  if (!Number.isFinite(n)) throw new Error(`Invalid ${key}`);
  return n;
};
export const env = {
  mockMode:
    process.env.MOCK_MODE === undefined
      ? process.env.NODE_ENV !== "production"
      : process.env.MOCK_MODE === "true",
  port: num("PORT", 3000),
  jwtSecret: process.env.JWT_SECRET ?? "development-only-change-me",
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  maxTemperature: num("DRYER_MAX_TEMPERATURE", 60),
  criticalTemperature: num("DRYER_CRITICAL_TEMPERATURE", 70),
  targetHumidity: num("DRYER_TARGET_HUMIDITY", 15),
  maxLoadKg: num("DRYER_MAX_LOAD_KG", 10),
  maxCurrent: num("DRYER_MAX_CURRENT", 10),
  telemetryInterval: num("DRYER_TELEMETRY_INTERVAL", 5),
  humidityConfirmationReadings: num("DRYER_HUMIDITY_CONFIRMATION_READINGS", 3),
};
