import bcrypt from "bcryptjs";
import { UserRepository } from "../repositories/index.repository.js";
import { authConfig } from "../config/config.js";
import { signAccessToken } from "../utils/jwt.js";

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

  return {
    userId: user.id,
    accessToken,
    expiresIn: authConfig.jwtExpiresIn,
  };
}
