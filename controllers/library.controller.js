import { LibraryService } from "../services/index.service.js";

let services = LibraryService;

export const __setServices = (overrides = {}) => {
  services = { ...LibraryService, ...overrides };
};

export const __resetServices = () => {
  services = LibraryService;
};

export const listUserLibrary = async (req, res) => {
  const targetUserId = req.params?.id;

  try {
    const games = await services.listLibrary({
      actor: req.user,
      targetUserId,
    });

    return res.status(200).json(games);
  } catch (error) {
    if (error.code === "LIBRARY_INVALID_TARGET") {
      return res.status(400).json({ message: "User id is required." });
    }

    if (error.code === "LIBRARY_FORBIDDEN") {
      return res.status(403).json({ message: "Access forbidden." });
    }

    if (error.code === "LIBRARY_USER_NOT_FOUND") {
      return res.status(404).json({ message: "User not found." });
    }

    console.error("listUserLibrary error:", error);
    return res.status(500).json({ message: "Unable to fetch library." });
  }
};

export const addGameToLibrary = async (req, res) => {
  const targetUserId = req.params?.id;
  const { gameId } = req.body ?? {};

  try {
    const entry = await services.addGameToLibrary({
      actor: req.user,
      targetUserId,
      gameId,
    });

    return res.status(201).json(entry);
  } catch (error) {
    if (error.code === "LIBRARY_INVALID_TARGET") {
      return res.status(400).json({ message: "User id is required." });
    }

    if (error.code === "LIBRARY_INVALID_GAME") {
      return res.status(400).json({ message: "gameId is required." });
    }

    if (error.code === "LIBRARY_FORBIDDEN") {
      return res.status(403).json({ message: "Access forbidden." });
    }

    if (error.code === "LIBRARY_USER_NOT_FOUND") {
      return res.status(404).json({ message: "User not found." });
    }

    if (error.code === "LIBRARY_GAME_NOT_FOUND") {
      return res.status(404).json({ message: "Game not found." });
    }

    if (error.code === "LIBRARY_DUPLICATE") {
      return res.status(409).json({ message: "Game already in library." });
    }

    console.error("addGameToLibrary error:", error);
    return res.status(500).json({ message: "Unable to add game to library." });
  }
};

export const removeGameFromLibrary = async (req, res) => {
  const targetUserId = req.params?.id;
  const gameId = req.params?.gameId;

  try {
    const result = await services.removeGameFromLibrary({
      actor: req.user,
      targetUserId,
      gameId,
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error.code === "LIBRARY_INVALID_TARGET") {
      return res.status(400).json({ message: "User id is required." });
    }

    if (error.code === "LIBRARY_INVALID_GAME") {
      return res.status(400).json({ message: "gameId is required." });
    }

    if (error.code === "LIBRARY_FORBIDDEN") {
      return res.status(403).json({ message: "Access forbidden." });
    }

    if (error.code === "LIBRARY_USER_NOT_FOUND") {
      return res.status(404).json({ message: "User not found." });
    }

    if (error.code === "LIBRARY_ENTRY_NOT_FOUND") {
      return res
        .status(404)
        .json({ message: "Game not found in user library." });
    }

    console.error("removeGameFromLibrary error:", error);
    return res
      .status(500)
      .json({ message: "Unable to remove game from library." });
  }
};
