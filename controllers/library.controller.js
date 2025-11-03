import { LibraryService } from "../services/index.service.js";

let services = LibraryService;
const ADMIN_ROLE = "ADMIN";

export const __setServices = (overrides = {}) => {
  services = { ...LibraryService, ...overrides };
};

export const __resetServices = () => {
  services = LibraryService;
};

const resolveTargetUserId = (req) => {
  const actor = req.user;
  const paramUserId = req.params?.id;

  if (actor?.role === ADMIN_ROLE) {
    return paramUserId ?? null;
  }

  return actor?.id ?? null;
};

export const listUserLibrary = async (req, res) => {
  const actor = req.user;
  const targetUserId = resolveTargetUserId(req);

  if (actor?.role === ADMIN_ROLE && !targetUserId) {
    return res.status(400).json({ message: "User id is required." });
  }

  try {
    const games = await services.listLibrary({
      actor,
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
  const actor = req.user;
  const targetUserId = resolveTargetUserId(req);
  const { gameId } = req.body ?? {};

  if (actor?.role === ADMIN_ROLE && !targetUserId) {
    return res.status(400).json({ message: "User id is required." });
  }

  try {
    const entry = await services.addGameToLibrary({
      actor,
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
  const actor = req.user;
  const targetUserId = resolveTargetUserId(req);
  const gameId = req.params?.gameId;

  if (actor?.role === ADMIN_ROLE && !targetUserId) {
    return res.status(400).json({ message: "User id is required." });
  }

  try {
    const result = await services.removeGameFromLibrary({
      actor,
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
