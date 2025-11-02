import { UserRepository } from '../repositories/index.repository.js';

/**
 * Create a user while enforcing unique email constraint at the application layer.
 * The password should already be hashed before calling this function.
 */
export async function createUser({ email, passwordHash, displayName }) {
  const existingUser = await UserRepository.findUserByEmail({ email });

  if (existingUser) {
    const error = new Error("User with this email already exists.");
    error.code = "USER_EMAIL_EXISTS";
    throw error;
  }

  return UserRepository.createUser({ email, passwordHash, displayName });
}
