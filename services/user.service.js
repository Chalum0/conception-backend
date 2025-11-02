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
 * Automatically promotes the very first account to ADMIN; others remain USER.
 * Hashes the provided password before persisting.
 */
export async function createUser({ email, password, displayName }) {
  const existingUser = await UserRepository.findUserByEmail({ email });

  if (existingUser) {
    const error = new Error("User with this email already exists.");
    error.code = "USER_EMAIL_EXISTS";
    throw error;
  }

  const userCount = await UserRepository.countUsers();
  const passwordHash = await bcrypt.hash(password, 12);
  const resolvedRole = userCount === 0 ? "ADMIN" : "USER";

  return UserRepository.createUser({
    email,
    passwordHash,
    displayName,
    role: resolvedRole,
  });
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
    role: user.role,
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
    role: user.role,
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

export async function refreshSession({ refreshToken }) {
  if (!refreshToken) {
    const error = new Error("Refresh token is required.");
    error.code = "REFRESH_MISSING_TOKEN";
    throw error;
  }

  const tokenHash = hashToken(refreshToken);
  const tokenRecord = await RefreshTokenRepository.findRefreshTokenByHash({
    tokenHash,
  });

  if (!tokenRecord || tokenRecord.revokedAt) {
    const error = new Error("Refresh token is invalid.");
    error.code = "REFRESH_INVALID_TOKEN";
    throw error;
  }

  if (tokenRecord.expiresAt <= new Date()) {
    await RefreshTokenRepository.revokeRefreshTokenById({
      id: tokenRecord.id,
      revokedAt: new Date(),
    });
    const error = new Error("Refresh token expired.");
    error.code = "REFRESH_TOKEN_EXPIRED";
    throw error;
  }

  const user = await UserRepository.findUserById({ id: tokenRecord.userId });

  if (!user) {
    await RefreshTokenRepository.revokeRefreshTokenById({
      id: tokenRecord.id,
      revokedAt: new Date(),
    });
    const error = new Error("Refresh token is invalid.");
    error.code = "REFRESH_INVALID_TOKEN";
    throw error;
  }

  // Rotate refresh token
  const newRefreshToken = generateRefreshTokenValue();
  const newTokenHash = hashToken(newRefreshToken);
  const newExpiresAt = addDurationToNow(authConfig.refreshExpiresIn);

  await RefreshTokenRepository.revokeRefreshTokenById({
    id: tokenRecord.id,
    revokedAt: new Date(),
  });

  await RefreshTokenRepository.createRefreshToken({
    userId: user.id,
    tokenHash: newTokenHash,
    expiresAt: newExpiresAt,
  });

  const newAccessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    userId: user.id,
    accessToken: newAccessToken,
    accessTokenExpiresIn: authConfig.jwtExpiresIn,
    refreshToken: newRefreshToken,
    refreshTokenExpiresAt: newExpiresAt.toISOString(),
    role: user.role,
  };
}
