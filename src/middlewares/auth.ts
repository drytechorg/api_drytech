import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { createHash, timingSafeEqual } from "crypto";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { AppError } from "../utils/http";
export interface DeviceRequest extends Request {
  device?: { id: string };
}
export async function authenticateDevice(
  req: DeviceRequest,
  _res: Response,
  next: NextFunction,
) {
  try {
    const device = await prisma.device.findUnique({
      where: { id: String(req.params.deviceId) },
    });
    const apiKey = req.header("x-device-api-key");
    if (!device || !apiKey)
      throw new AppError(401, "Invalid device credentials");
    const actual = Buffer.from(
      createHash("sha256").update(apiKey).digest("hex"),
    );
    const expected = Buffer.from(device.apiKeyHash);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      throw new AppError(401, "Invalid device credentials");
    req.device = { id: device.id };
    next();
  } catch (e) {
    next(e);
  }
}
export function authenticateAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const header = req.header("authorization");
    if (!header?.startsWith("Bearer "))
      throw new AppError(401, "Admin token required");
    const payload = jwt.verify(header.slice(7), env.jwtSecret);
    if (typeof payload !== "object" || payload.role !== "admin")
      throw new AppError(401, "Admin token required");
    next();
  } catch {
    next(new AppError(401, "Invalid admin token"));
  }
}

