import {
  UserRepository,
  GameRepository,
  UserGameRepository,
} from "../repositories/index.repository.js";

const defaultDependencies = {
  UserRepository,
  GameRepository,
  UserGameRepository,
};

let dependencies = { ...defaultDependencies };

export function __setDependencies(overrides = {}) {
  dependencies = { ...defaultDependencies, ...overrides };
}

export function __resetDependencies() {
  dependencies = { ...defaultDependencies };
}

const ADMIN_ROLE = "ADMIN";

function ensureActorCanManage({ actor, targetUserId }) {
  if (!actor || (!actor.id && !actor.role)) {
    const error = new Error("Authentication required.");
    error.code = "LIBRARY_FORBIDDEN";
    throw error;
  }

  if (actor.role === ADMIN_ROLE) {
    return;
  }

  if (actor.id !== targetUserId) {
    const error = new Error("Forbidden.");
    error.code = "LIBRARY_FORBIDDEN";
    throw error;
  }
}

function normalizeEntry({ entry }) {
  return {
    id: entry.game.id,
    title: entry.game.title,
    platform: entry.game.platform,
    price: entry.game.price?.toNumber?.() ?? Number(entry.game.price),
    publisher: entry.game.publisher,
    acquiredAt: entry.acquiredAt.toISOString(),
  };
}

export async function listLibrary({ actor, targetUserId }) {
  if (!targetUserId) {
    const error = new Error("User id is required.");
    error.code = "LIBRARY_INVALID_TARGET";
    throw error;
  }

  ensureActorCanManage({ actor, targetUserId });

  const { UserRepository: userRepository, UserGameRepository: userGameRepository } =
    dependencies;

  const target = await userRepository.findUserById({ id: targetUserId });

  if (!target) {
    const error = new Error("User not found.");
    error.code = "LIBRARY_USER_NOT_FOUND";
    throw error;
  }

  const entries = await userGameRepository.findGamesByUserId({
    userId: target.id,
  });

  return entries.map((entry) => normalizeEntry({ entry }));
}

export async function addGameToLibrary({ actor, targetUserId, gameId }) {
  if (!gameId) {
    const error = new Error("gameId is required.");
    error.code = "LIBRARY_INVALID_GAME";
    throw error;
  }

  if (!targetUserId) {
    const error = new Error("User id is required.");
    error.code = "LIBRARY_INVALID_TARGET";
    throw error;
  }

  ensureActorCanManage({ actor, targetUserId });

  const {
    UserRepository: userRepository,
    GameRepository: gameRepository,
    UserGameRepository: userGameRepository,
  } = dependencies;

  const target = await userRepository.findUserById({ id: targetUserId });

  if (!target) {
    const error = new Error("User not found.");
    error.code = "LIBRARY_USER_NOT_FOUND";
    throw error;
  }

  const game = await gameRepository.findGameById({ id: gameId });

  if (!game) {
    const error = new Error("Game not found.");
    error.code = "LIBRARY_GAME_NOT_FOUND";
    throw error;
  }

  const existing = await userGameRepository.findByUserAndGame({
    userId: target.id,
    gameId,
  });

  if (existing) {
    const error = new Error("Game already in library.");
    error.code = "LIBRARY_DUPLICATE";
    throw error;
  }

  const entry = await userGameRepository.createUserGame({
    userId: target.id,
    gameId,
  });

  return normalizeEntry({ entry });
}

export async function removeGameFromLibrary({
  actor,
  targetUserId,
  gameId,
}) {
  if (!gameId) {
    const error = new Error("gameId is required.");
    error.code = "LIBRARY_INVALID_GAME";
    throw error;
  }

  if (!targetUserId) {
    const error = new Error("User id is required.");
    error.code = "LIBRARY_INVALID_TARGET";
    throw error;
  }

  ensureActorCanManage({ actor, targetUserId });

  const {
    UserRepository: userRepository,
    UserGameRepository: userGameRepository,
  } = dependencies;

  const target = await userRepository.findUserById({ id: targetUserId });

  if (!target) {
    const error = new Error("User not found.");
    error.code = "LIBRARY_USER_NOT_FOUND";
    throw error;
  }

  const existing = await userGameRepository.findByUserAndGame({
    userId: target.id,
    gameId,
  });

  if (!existing) {
    const error = new Error("Game not found in library.");
    error.code = "LIBRARY_ENTRY_NOT_FOUND";
    throw error;
  }

  await userGameRepository.deleteUserGame({
    userId: target.id,
    gameId,
  });

  return { id: gameId, deleted: true };
}
