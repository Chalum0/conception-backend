import { UserGameModel } from "../models/user-game.model.js";

export function findGamesByUserId({ userId }) {
  return UserGameModel.findMany({
    where: { userId },
    include: {
      game: true,
    },
    orderBy: { acquiredAt: "desc" },
  });
}

export function findByUserAndGame({ userId, gameId }) {
  return UserGameModel.findUnique({
    where: {
      userId_gameId: {
        userId,
        gameId,
      },
    },
    include: {
      game: true,
    },
  });
}

export function createUserGame({ userId, gameId }) {
  return UserGameModel.create({
    data: {
      userId,
      gameId,
    },
    include: {
      game: true,
    },
  });
}

export function deleteUserGame({ userId, gameId }) {
  return UserGameModel.delete({
    where: {
      userId_gameId: {
        userId,
        gameId,
      },
    },
  });
}
