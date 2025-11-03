import { GameConfigRepository } from "../repositories/index.repository.js";

const defaultDependencies = {
  GameConfigRepository,
};

let dependencies = { ...defaultDependencies };

export function __setDependencies(overrides = {}) {
  dependencies = { ...defaultDependencies, ...overrides };
}

export function __resetDependencies() {
  dependencies = { ...defaultDependencies };
}

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const assertValidIdentifiers = ({ userId, gameId }) => {
  if (!isNonEmptyString(userId)) {
    const error = new Error("userId is required.");
    error.code = "GAME_CONFIG_INVALID_USER";
    throw error;
  }

  if (!isNonEmptyString(gameId)) {
    const error = new Error("gameId is required.");
    error.code = "GAME_CONFIG_INVALID_GAME";
    throw error;
  }
};

const normalizeSettings = (settings) => {
  if (settings === null || settings === undefined) {
    return {};
  }

  if (typeof settings !== "object" || Array.isArray(settings)) {
    const error = new Error("settings must be an object.");
    error.code = "GAME_CONFIG_INVALID_SETTINGS";
    throw error;
  }

  return settings;
};

export async function saveGameConfig({ userId, gameId, settings }) {
  assertValidIdentifiers({ userId, gameId });

  const normalizedSettings = normalizeSettings(settings);

  const { GameConfigRepository: repo } = dependencies;

  const record = await repo.upsertGameConfig({
    userId: userId.trim(),
    gameId: gameId.trim(),
    settings: normalizedSettings,
  });

  return record;
}

export async function getGameConfig({ userId, gameId }) {
  assertValidIdentifiers({ userId, gameId });

  const { GameConfigRepository: repo } = dependencies;

  return repo.findGameConfig({
    userId: userId.trim(),
    gameId: gameId.trim(),
  });
}

export async function listGameConfigsForUser({ userId }) {
  if (!isNonEmptyString(userId)) {
    const error = new Error("userId is required.");
    error.code = "GAME_CONFIG_INVALID_USER";
    throw error;
  }

  const { GameConfigRepository: repo } = dependencies;
  return repo.listGameConfigsByUser({ userId: userId.trim() });
}

export async function removeGameConfig({ userId, gameId }) {
  assertValidIdentifiers({ userId, gameId });

  const { GameConfigRepository: repo } = dependencies;

  await repo.deleteGameConfig({
    userId: userId.trim(),
    gameId: gameId.trim(),
  });

  return { userId: userId.trim(), gameId: gameId.trim(), deleted: true };
}
