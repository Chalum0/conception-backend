import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import {
  listGames,
  createGame,
  __setDependencies,
  __resetDependencies,
} from "../services/game.service.js";

beforeEach(() => {
  mock.reset();
  __resetDependencies();
});

afterEach(() => {
  mock.reset();
  __resetDependencies();
});

describe("GameService.listGames", () => {
  it("returns all games ordered by title", async () => {
    const games = [
      { id: "1", title: "A Game", platform: "PC" },
      { id: "2", title: "B Game", platform: "Console" },
    ];
    const findAllGames = mock.fn(async () => games);

    __setDependencies({
      GameRepository: {
        findAllGames,
      },
    });

    const result = await listGames();

    assert.deepEqual(result, games);
    assert.equal(findAllGames.mock.callCount(), 1);
  });

  it("propagates repository errors", async () => {
    const error = new Error("db down");
    const findAllGames = mock.fn(async () => {
      throw error;
    });

    __setDependencies({
      GameRepository: {
        findAllGames,
      },
    });

    await assert.rejects(listGames(), error);
  });
});

describe("GameService.createGame", () => {
  it("throws when title is missing", async () => {
    await assert.rejects(
      createGame({
        platform: "PC",
        price: 10,
        publisher: "Studio",
      }),
      { code: "GAME_INVALID_TITLE" },
    );
  });

  it("throws when price is invalid", async () => {
    await assert.rejects(
      createGame({
        title: "Test",
        platform: "PC",
        price: -5,
        publisher: "Studio",
      }),
      { code: "GAME_INVALID_PRICE" },
    );
  });

  it("throws when platform is missing", async () => {
    await assert.rejects(
      createGame({
        title: "Test",
        publisher: "Studio",
        price: 10,
      }),
      { code: "GAME_INVALID_PLATFORM" },
    );
  });

  it("throws when publisher is missing", async () => {
    await assert.rejects(
      createGame({
        title: "Test",
        platform: "PC",
        price: 10,
      }),
      { code: "GAME_INVALID_PUBLISHER" },
    );
  });

  it("creates a game via repository with normalized data", async () => {
    const createGameRepo = mock.fn(async (data) => ({
      id: "game-1",
      ...data,
    }));

    __setDependencies({
      GameRepository: {
        findAllGames: mock.fn(),
        createGame: createGameRepo,
      },
    });

    const result = await createGame({
      title: "  Test Game ",
      platform: " PC ",
      price: 19.995,
      publisher: " Studio ",
    });

    assert.equal(createGameRepo.mock.callCount(), 1);
    const call = createGameRepo.mock.calls[0];
    assert.equal(call.arguments[0].title, "Test Game");
    assert.equal(call.arguments[0].platform, "PC");
    assert.equal(call.arguments[0].publisher, "Studio");
    assert.equal(call.arguments[0].price.toString(), "20");
    assert.equal(result.id, "game-1");
  });
});
