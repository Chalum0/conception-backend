import bcrypt from "bcryptjs";
import { UserRepository } from "../repositories/index.repository.js";

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
