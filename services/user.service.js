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

const defaultDependencies = {
  bcrypt,
  UserRepository,
  RefreshTokenRepository,
  signAccessToken,
  generateRefreshTokenValue,
  hashToken,
  addDurationToNow,
};

let dependencies = { ...defaultDependencies };

export function __setDependencies(overrides = {}) {
  dependencies = { ...defaultDependencies, ...overrides };
}

export function __resetDependencies() {
  dependencies = { ...defaultDependencies };
}

/**
 * Create a user while enforcing unique email constraint at the application layer.
 * Automatically promotes the very first account to ADMIN; others remain USER.
 * Hashes the provided password before persisting.
 */
export async function createUser({ email, password, displayName }) {
  const { UserRepository: userRepository, bcrypt: bcryptLib } = dependencies;

  const existingUser = await userRepository.findUserByEmail({ email });

  if (existingUser) {
    const error = new Error("User with this email already exists.");
    error.code = "USER_EMAIL_EXISTS";
    throw error;
  }

  const userCount = await userRepository.countUsers();
  const passwordHash = await bcryptLib.hash(password, 12);
  const resolvedRole = userCount === 0 ? "ADMIN" : "USER";

  return userRepository.createUser({
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
  const {
    UserRepository: userRepository,
    RefreshTokenRepository: refreshTokenRepository,
    bcrypt: bcryptLib,
    signAccessToken: signAccessTokenFn,
    generateRefreshTokenValue: generateRefreshToken,
    hashToken: hashRefreshToken,
    addDurationToNow: addDuration,
  } = dependencies;

  const user = await userRepository.findUserByEmail({ email });

  const invalidCredentials = () => {
    const error = new Error("Invalid email or password.");
    error.code = "AUTH_INVALID_CREDENTIALS";
    return error;
  };

  if (!user) {
    throw invalidCredentials();
  }

  const passwordValid = await bcryptLib.compare(password, user.passwordHash);
  if (!passwordValid) {
    throw invalidCredentials();
  }

  const accessToken = signAccessTokenFn({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(refreshToken);
  const expiresAt = addDuration(authConfig.refreshExpiresIn);

  await refreshTokenRepository.createRefreshToken({
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
  const {
    RefreshTokenRepository: refreshTokenRepository,
    hashToken: hashRefreshToken,
  } = dependencies;

  if (!refreshToken) {
    const error = new Error("Refresh token is required.");
    error.code = "LOGOUT_MISSING_TOKEN";
    throw error;
  }

  const tokenHash = hashRefreshToken(refreshToken);
  const tokenRecord = await refreshTokenRepository.findRefreshTokenByHash({
    tokenHash,
  });

  if (!tokenRecord) {
    // No matching token; treat as already logged out.
    return { revoked: false };
  }

  if (tokenRecord.revokedAt) {
    return { revoked: false };
  }

  await refreshTokenRepository.revokeRefreshTokenByHash({
    tokenHash,
    revokedAt: new Date(),
  });

  return { revoked: true };
}

export async function refreshSession({ refreshToken }) {
  const {
    RefreshTokenRepository: refreshTokenRepository,
    UserRepository: userRepository,
    hashToken: hashRefreshToken,
    generateRefreshTokenValue: generateRefreshToken,
    addDurationToNow: addDuration,
    signAccessToken: signAccessTokenFn,
  } = dependencies;

  if (!refreshToken) {
    const error = new Error("Refresh token is required.");
    error.code = "REFRESH_MISSING_TOKEN";
    throw error;
  }

  const tokenHash = hashRefreshToken(refreshToken);
  const tokenRecord = await refreshTokenRepository.findRefreshTokenByHash({
    tokenHash,
  });

  if (!tokenRecord || tokenRecord.revokedAt) {
    const error = new Error("Refresh token is invalid.");
    error.code = "REFRESH_INVALID_TOKEN";
    throw error;
  }

  if (tokenRecord.expiresAt <= new Date()) {
    await refreshTokenRepository.revokeRefreshTokenById({
      id: tokenRecord.id,
      revokedAt: new Date(),
    });
    const error = new Error("Refresh token expired.");
    error.code = "REFRESH_TOKEN_EXPIRED";
    throw error;
  }

  const user = await userRepository.findUserById({ id: tokenRecord.userId });

  if (!user) {
    await refreshTokenRepository.revokeRefreshTokenById({
      id: tokenRecord.id,
      revokedAt: new Date(),
    });
    const error = new Error("Refresh token is invalid.");
    error.code = "REFRESH_INVALID_TOKEN";
    throw error;
  }

  // Rotate refresh token
  const newRefreshToken = generateRefreshToken();
  const newTokenHash = hashRefreshToken(newRefreshToken);
  const newExpiresAt = addDuration(authConfig.refreshExpiresIn);

  await refreshTokenRepository.revokeRefreshTokenById({
    id: tokenRecord.id,
    revokedAt: new Date(),
  });

  await refreshTokenRepository.createRefreshToken({
    userId: user.id,
    tokenHash: newTokenHash,
    expiresAt: newExpiresAt,
  });

  const newAccessToken = signAccessTokenFn({
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
