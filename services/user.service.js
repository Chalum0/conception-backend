import bcrypt from "bcryptjs";
import {
  UserRepository,
  RefreshTokenRepository,
} from "../repositories/index.repository.js";
import { authConfig } from "../config/config.js";
import { signAccessToken } from "../utils/jwt.js";
import {
  generateRefreshTokenValue,
  hashToken,
  addDurationToNow,
} from "../utils/token.js";

/**
 * Create a user while enforcing unique email constraint at the application layer.
 * Hashes the provided password before persisting.
 */
export async function createUser({ email, password, displayName }) {
  const existingUser = await UserRepository.findUserByEmail({ email });

  if (existingUser) {
    const error = new Error("User with this email already exists.");
    error.code = "USER_EMAIL_EXISTS";
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  return UserRepository.createUser({ email, passwordHash, displayName });
}

/**
 * Authenticate a user and return a signed JWT access token.
 */
export async function authenticateUser({ email, password }) {
  const user = await UserRepository.findUserByEmail({ email });

  const invalidCredentials = () => {
    const error = new Error("Invalid email or password.");
    error.code = "AUTH_INVALID_CREDENTIALS";
    return error;
  };

  if (!user) {
    throw invalidCredentials();
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    throw invalidCredentials();
  }

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
  });

  const refreshToken = generateRefreshTokenValue();
  const tokenHash = hashToken(refreshToken);
  const expiresAt = addDurationToNow(authConfig.refreshExpiresIn);

  await RefreshTokenRepository.createRefreshToken({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  return {
    userId: user.id,
    accessToken,
    accessTokenExpiresIn: authConfig.jwtExpiresIn,
    refreshToken,
    refreshTokenExpiresAt: expiresAt.toISOString(),
  };
}

export async function logoutUser({ refreshToken }) {
  if (!refreshToken) {
    const error = new Error("Refresh token is required.");
    error.code = "LOGOUT_MISSING_TOKEN";
    throw error;
  }

  const tokenHash = hashToken(refreshToken);
  const tokenRecord = await RefreshTokenRepository.findRefreshTokenByHash({
    tokenHash,
  });

  if (!tokenRecord) {
    // No matching token; treat as already logged out.
    return { revoked: false };
  }

  if (tokenRecord.revokedAt) {
    return { revoked: false };
  }

  await RefreshTokenRepository.revokeRefreshTokenByHash({
    tokenHash,
    revokedAt: new Date(),
  });

  return { revoked: true };
}
