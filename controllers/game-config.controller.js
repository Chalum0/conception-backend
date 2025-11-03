import { GameConfigService } from "../services/index.service.js";

let services = GameConfigService;
const ADMIN_ROLE = "ADMIN";

export const __setServices = (overrides = {}) => {
  services = { ...GameConfigService, ...overrides };
};

export const __resetServices = () => {
  services = GameConfigService;
};

const resolveTargetUserId = (req) => {
  const actor = req.user;
  const paramUserId = req.params?.id;

  if (actor?.role === ADMIN_ROLE) {
    return paramUserId ?? null;
  }

  return actor?.id ?? null;
};

export const getGameConfig = async (req, res) => {
  const actor = req.user;
  const targetUserId = resolveTargetUserId(req);
  const gameId = req.params?.gameId ?? "";

  if (actor?.role === ADMIN_ROLE && !targetUserId) {
    return res.status(400).json({ message: "User id is required." });
  }

  try {
    const record = await services.getGameConfig({
      actor,
      userId: targetUserId,
      gameId,
    });

    if (!record) {
      return res.status(404).json({ message: "Game configuration not found." });
    }

    return res.status(200).json(record);
  } catch (error) {
    if (
      error.code === "GAME_CONFIG_INVALID_USER" ||
      error.code === "GAME_CONFIG_INVALID_GAME"
    ) {
      return res.status(400).json({ message: error.message });
    }

    if (error.code === "GAME_CONFIG_FORBIDDEN") {
      return res.status(403).json({ message: "Access forbidden." });
    }

    console.error("getGameConfig error:", error);
    return res.status(500).json({ message: "Unable to load game configuration." });
  }
};

export const saveGameConfig = async (req, res) => {
  const actor = req.user;
  const targetUserId = resolveTargetUserId(req);
  const gameId = req.params?.gameId ?? "";
  const settings = { ...req.body };

  if (!targetUserId) {
    return res.status(400).json({ message: "User id is required." });
  }

  try {
    const record = await services.saveGameConfig({
      actor,
      userId: targetUserId,
      gameId,
      settings,
    });

    return res.status(200).json(record);
  } catch (error) {
    if (
      error.code === "GAME_CONFIG_INVALID_USER" ||
      error.code === "GAME_CONFIG_INVALID_GAME" ||
      error.code === "GAME_CONFIG_INVALID_SETTINGS"
    ) {
      return res.status(400).json({ message: error.message });
    }

    if (error.code === "GAME_CONFIG_FORBIDDEN") {
      return res.status(403).json({ message: "Access forbidden." });
    }

    console.error("saveGameConfig error:", error);
    return res.status(500).json({ message: "Unable to save game configuration." });
  }
};

export const listGameConfigs = async (req, res) => {
  const actor = req.user;
  const targetUserId = resolveTargetUserId(req);

  if (actor?.role === ADMIN_ROLE && !targetUserId) {
    return res.status(400).json({ message: "User id is required." });
  }

  try {
    const records = await services.listGameConfigsForUser({
      actor,
      userId: targetUserId,
    });

    return res.status(200).json(records);
  } catch (error) {
    if (error.code === "GAME_CONFIG_INVALID_USER") {
      return res.status(400).json({ message: error.message });
    }

    if (error.code === "GAME_CONFIG_FORBIDDEN") {
      return res.status(403).json({ message: "Access forbidden." });
    }

    console.error("listGameConfigs error:", error);
    return res.status(500).json({ message: "Unable to list game configurations." });
  }
};
