import { UserModel } from "../models/user.model.js";

export async function createUser({ email, passwordHash, displayName, role }) {
  return UserModel.create({
    data: { email, passwordHash, displayName, role },
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

export function countUsers() {
  return UserModel.count();
}
