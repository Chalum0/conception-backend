import { GameService } from "../services/index.service.js";

let services = GameService;

export const __setServices = (overrides = {}) => {
  services = { ...GameService, ...overrides };
};

export const __resetServices = () => {
  services = GameService;
};

export const listGames = async (_req, res) => {
  try {
    const games = await services.listGames();
    return res.status(200).json(games);
  } catch (error) {
    console.error("listGames error:", error);
    return res.status(500).json({ message: "Unable to fetch games." });
  }
};

export const createGame = async (req, res) => {
  const { title, platform, price, publisher } = req.body ?? {};

  try {
    const game = await services.createGame({
      title,
      platform,
      price,
      publisher,
    });

    return res.status(201).json(game);
  } catch (error) {
    if (
      error.code === "GAME_INVALID_TITLE" ||
      error.code === "GAME_INVALID_PLATFORM" ||
      error.code === "GAME_INVALID_PRICE" ||
      error.code === "GAME_INVALID_PUBLISHER"
    ) {
      return res.status(400).json({ message: error.message });
    }

    console.error("createGame error:", error);
    return res.status(500).json({ message: "Unable to create game." });
  }
};
