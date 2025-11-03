import { createRequire } from "node:module";

let MongoPrismaClient;
let cachedClient;

const require = createRequire(import.meta.url);

try {
  ({ PrismaClient: MongoPrismaClient } =
    require("../generated/mongo-client/index.js"));
} catch (error) {
  MongoPrismaClient = null;
}

export function getMongoPrismaClient() {
  if (!MongoPrismaClient) {
    throw new Error(
      "Mongo Prisma client not generated. Run `npx prisma generate --schema prisma-mongo/schema.prisma`.",
    );
  }

  if (!cachedClient) {
    cachedClient = new MongoPrismaClient();
  }

  return cachedClient;
}

export default getMongoPrismaClient;
