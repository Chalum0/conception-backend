import { GameModel } from "../models/game.model.js";

export function findAllGames() {
  return GameModel.findMany({
    orderBy: { title: "asc" },
  });
}

export function findGameById({ id }) {
  return GameModel.findUnique({
    where: { id },
  });
}

export function createGame({ title, platform, price, publisher }) {
  return GameModel.create({
    data: {
      title,
      platform,
      price,
      publisher,
    },
  });
}
