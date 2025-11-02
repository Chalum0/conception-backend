import jwt from "jsonwebtoken";
import { authConfig } from "../config/config.js";

export const signAccessToken = (payload) =>
  jwt.sign(payload, authConfig.jwtSecret, {
    expiresIn: authConfig.jwtExpiresIn,
  });

export const verifyAccessToken = (token) =>
  jwt.verify(token, authConfig.jwtSecret);
