import { PrismaClient } from "@prisma/client";
import { postgresConfig } from "./config.js";

export const prisma = new PrismaClient({
  datasources: {
    db: { url: postgresConfig.url },
  },
});

export default prisma;
