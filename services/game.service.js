import { Prisma } from "@prisma/client";
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

const requiredString = (value) =>
  typeof value === "string" && value.trim().length > 0;

export async function createGame({ title, platform, price, publisher }) {
  const { GameRepository: gameRepository } = dependencies;

  if (!requiredString(title)) {
    const error = new Error("title is required.");
    error.code = "GAME_INVALID_TITLE";
    throw error;
  }

  if (!requiredString(platform)) {
    const error = new Error("platform is required.");
    error.code = "GAME_INVALID_PLATFORM";
    throw error;
  }

  if (!requiredString(publisher)) {
    const error = new Error("publisher is required.");
    error.code = "GAME_INVALID_PUBLISHER";
    throw error;
  }

  const numericPrice =
    typeof price === "string" ? Number.parseFloat(price) : price;

  if (
    typeof numericPrice !== "number" ||
    Number.isNaN(numericPrice) ||
    !Number.isFinite(numericPrice) ||
    numericPrice < 0
  ) {
    const error = new Error("price must be a non-negative number.");
    error.code = "GAME_INVALID_PRICE";
    throw error;
  }

  const decimalPrice = new Prisma.Decimal(numericPrice.toFixed(2));

  return gameRepository.createGame({
    title: title.trim(),
    platform: platform.trim(),
    publisher: publisher.trim(),
    price: decimalPrice,
  });
}
