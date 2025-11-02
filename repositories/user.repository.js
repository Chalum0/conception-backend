import { UserModel } from "../models/user.model.js";

export async function createUser({ email, passwordHash, displayName }) {
  return UserModel.create({
    data: { email, passwordHash, displayName },
  });
}

export function findUserByEmail({ email }) {
  return UserModel.findUnique({
    where: { email },
  });
}

export function findUserById({ id }) {
  return UserModel.findUnique({
    where: { id },
  });
}
