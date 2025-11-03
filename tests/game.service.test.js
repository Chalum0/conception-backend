import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import {
  listGames,
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
