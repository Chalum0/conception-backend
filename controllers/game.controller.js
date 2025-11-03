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
