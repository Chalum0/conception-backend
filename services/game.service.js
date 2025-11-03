import { GameRepository } from "../repositories/index.repository.js";

const defaultDependencies = {
  GameRepository,
};

let dependencies = { ...defaultDependencies };

export function __setDependencies(overrides = {}) {
  dependencies = { ...defaultDependencies, ...overrides };
}

export function __resetDependencies() {
  dependencies = { ...defaultDependencies };
}

export async function listGames() {
  const { GameRepository: gameRepository } = dependencies;
  return gameRepository.findAllGames();
}
