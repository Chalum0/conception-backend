import { randomBytes, createHash } from "crypto";
import ms from "ms";

export const generateRefreshTokenValue = () =>
  randomBytes(48).toString("hex");

export const hashToken = (token) =>
  createHash("sha256").update(token).digest("hex");

export const addDurationToNow = (duration) =>
  new Date(Date.now() + ms(duration));
