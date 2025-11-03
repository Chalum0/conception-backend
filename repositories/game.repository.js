import { GameModel } from "../models/game.model.js";

export function findAllGames() {
  return GameModel.findMany({
    orderBy: { title: "asc" },
  });
}
