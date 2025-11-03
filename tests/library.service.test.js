import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import {
  removeGameFromLibrary,
  __setDependencies,
  __resetDependencies,
} from "../services/library.service.js";

beforeEach(() => {
  __resetDependencies();
  mock.reset();
});

afterEach(() => {
  __resetDependencies();
  mock.reset();
});

describe("LibraryService.removeGameFromLibrary", () => {
  it("deletes game config after removing library entry", async () => {
    const deleteUserGame = mock.fn(async () => ({}));
    const deleteGameConfig = mock.fn(async () => ({}));

    __setDependencies({
      UserRepository: {
        findUserById: mock.fn(async () => ({ id: "user-1" })),
      },
      UserGameRepository: {
        findByUserAndGame: mock.fn(async () => ({ id: "entry-1" })),
        deleteUserGame,
      },
      GameConfigRepository: {
        deleteGameConfig,
      },
    });

    const result = await removeGameFromLibrary({
      actor: { id: "user-1", role: "USER" },
      targetUserId: "user-1",
      gameId: "game-1",
    });

    assert.deepEqual(result, { id: "game-1", deleted: true });
    assert.equal(deleteUserGame.mock.callCount(), 1);
    assert.equal(deleteGameConfig.mock.callCount(), 1);
  });
});
