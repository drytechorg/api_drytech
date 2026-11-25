import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { timingSafeEqual } from "crypto";
import { z } from "zod";
import { env } from "../config/env";
import { AppError, asyncHandler } from "../utils/http";

const loginSchema = z.object({ username: z.string().min(1), password: z.string().min(1) }).strict();

function safeEqual(actualValue: string, expectedValue: string): boolean {
  const actual = Buffer.from(actualValue);
  const expected = Buffer.from(expectedValue);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = loginSchema.parse(req.body);
  if (!env.adminUsername || !env.adminPassword)
    throw new AppError(503, "Admin credentials are not configured");
  if (!safeEqual(username, env.adminUsername) || !safeEqual(password, env.adminPassword))
    throw new AppError(401, "Invalid username or password");

  const token = jwt.sign({ role: "admin" }, env.jwtSecret, {
    subject: env.adminUsername,
    expiresIn: "8h",
  });
  res.json({ token, tokenType: "Bearer", expiresIn: 28800 });
});

