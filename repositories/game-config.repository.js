import { getMongoPrismaClient } from "../config/prisma.mongo.js";

const collectionName = "gameConfig";

const getCollection = () => {
  const prisma = getMongoPrismaClient();
  if (!prisma[collectionName]) {
    throw new Error(
      "Mongo Prisma client is missing the gameConfig model. Ensure prisma-mongo/schema.prisma is up to date.",
    );
  }
  return prisma[collectionName];
};

export function upsertGameConfig({ userId, gameId, settings }) {
  const prismaCollection = getCollection();

  return prismaCollection.upsert({
    where: {
      userId_gameId: {
        userId,
        gameId,
      },
    },
    update: {
      settings,
    },
    create: {
      userId,
      gameId,
      settings,
    },
  });
}

export function findGameConfig({ userId, gameId }) {
  const prismaCollection = getCollection();

  return prismaCollection.findUnique({
    where: {
      userId_gameId: {
        userId,
        gameId,
      },
    },
  });
}

export function listGameConfigsByUser({ userId }) {
  const prismaCollection = getCollection();

  return prismaCollection.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
}

export function deleteGameConfig({ userId, gameId }) {
  const prismaCollection = getCollection();

  return prismaCollection.delete({
    where: {
      userId_gameId: {
        userId,
        gameId,
      },
    },
  });
}
