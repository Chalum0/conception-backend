import { GameConfigRepository } from "../repositories/index.repository.js";

const defaultDependencies = {
  GameConfigRepository,
};

let dependencies = { ...defaultDependencies };

const ADMIN_ROLE = "ADMIN";

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

const assertActorPresent = (actor) => {
  if (!actor || !actor.id) {
    const error = new Error("Authentication required.");
    error.code = "GAME_CONFIG_FORBIDDEN";
    throw error;
  }
};

const assertActorCanWrite = ({ actor, targetUserId }) => {
  assertActorPresent(actor);

  if (actor.role === ADMIN_ROLE) {
    const error = new Error("Admins cannot modify user settings.");
    error.code = "GAME_CONFIG_FORBIDDEN";
    throw error;
  }

  if (actor.id !== targetUserId) {
    const error = new Error("Forbidden.");
    error.code = "GAME_CONFIG_FORBIDDEN";
    throw error;
  }
};

const assertActorCanRead = ({ actor, targetUserId }) => {
  assertActorPresent(actor);

  if (actor.role === ADMIN_ROLE) {
    return;
  }

  if (actor.id !== targetUserId) {
    const error = new Error("Forbidden.");
    error.code = "GAME_CONFIG_FORBIDDEN";
    throw error;
  }
};

export async function saveGameConfig({ actor, userId, gameId, settings }) {
  assertValidIdentifiers({ userId, gameId });
  assertActorCanWrite({ actor, targetUserId: userId.trim() });

  const normalizedSettings = normalizeSettings(settings);

  const { GameConfigRepository: repo } = dependencies;

  const record = await repo.upsertGameConfig({
    userId: userId.trim(),
    gameId: gameId.trim(),
    settings: normalizedSettings,
  });

  return record;
}

export async function getGameConfig({ actor, userId, gameId }) {
  assertValidIdentifiers({ userId, gameId });
  assertActorCanRead({ actor, targetUserId: userId.trim() });

  const { GameConfigRepository: repo } = dependencies;

  return repo.findGameConfig({
    userId: userId.trim(),
    gameId: gameId.trim(),
  });
}

export async function listGameConfigsForUser({ actor, userId }) {
  if (!isNonEmptyString(userId)) {
    const error = new Error("userId is required.");
    error.code = "GAME_CONFIG_INVALID_USER";
    throw error;
  }

  assertActorCanRead({ actor, targetUserId: userId.trim() });

  const { GameConfigRepository: repo } = dependencies;
  return repo.listGameConfigsByUser({ userId: userId.trim() });
}

export async function removeGameConfig({ actor, userId, gameId }) {
  assertValidIdentifiers({ userId, gameId });
  assertActorCanWrite({ actor, targetUserId: userId.trim() });

  const { GameConfigRepository: repo } = dependencies;

  await repo.deleteGameConfig({
    userId: userId.trim(),
    gameId: gameId.trim(),
  });

  return { userId: userId.trim(), gameId: gameId.trim(), deleted: true };
}
