import prisma from "../config/prisma.js";

/**
 * Prisma delegate for the User model.
 * Keeping this in /models maintains the project convention while using Prisma under the hood.
 */
export const UserModel = prisma.user;

export default UserModel;
