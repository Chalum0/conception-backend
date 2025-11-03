import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import {
  listLibrary,
  addGameToLibrary,
  removeGameFromLibrary,
  __setDependencies,
  __resetDependencies,
} from "../services/library.service.js";

beforeEach(() => {
  mock.reset();
  __resetDependencies();
});

afterEach(() => {
  mock.reset();
  __resetDependencies();
});

describe("LibraryService.listLibrary", () => {
  it("throws when actor lacks permission", async () => {
    await assert.rejects(
      listLibrary({ actor: { id: "user-1", role: "USER" }, targetUserId: "user-2" }),
      { code: "LIBRARY_FORBIDDEN" },
    );
  });

  it("returns user's games", async () => {
    const games = [
      {
        game: {
          id: "game-1",
          title: "Test",
          platform: "PC",
          publisher: "Studio",
          price: { toNumber: () => 9.99 },
        },
        acquiredAt: new Date("2024-01-01T00:00:00Z"),
      },
    ];

    __setDependencies({
      UserRepository: {
        findUserById: mock.fn(async () => ({ id: "user-1" })),
      },
      UserGameRepository: {
        findGamesByUserId: mock.fn(async () => games),
      },
    });

    const result = await listLibrary({
      actor: { id: "user-1", role: "USER" },
      targetUserId: "user-1",
    });

    assert.deepEqual(result, [
      {
        id: "game-1",
        title: "Test",
        platform: "PC",
        publisher: "Studio",
        price: 9.99,
        acquiredAt: "2024-01-01T00:00:00.000Z",
      },
    ]);
  });
});

describe("LibraryService.addGameToLibrary", () => {
  it("throws when game already in library", async () => {
    __setDependencies({
      UserRepository: {
        findUserById: mock.fn(async ({ id }) => ({ id, role: "USER" })),
      },
      GameRepository: {
        findGameById: mock.fn(async () => ({ id: "game-1" })),
      },
      UserGameRepository: {
        findByUserAndGame: mock.fn(async () => ({ id: "existing" })),
      },
    });

    await assert.rejects(
      addGameToLibrary({
        actor: { id: "user-1", role: "USER" },
        targetUserId: "user-1",
        gameId: "game-1",
      }),
      { code: "LIBRARY_DUPLICATE" },
    );
  });

  it("adds a game when permitted", async () => {
    const createUserGame = mock.fn(async () => ({
      game: {
        id: "game-1",
        title: "Test",
        platform: "PC",
        publisher: "Studio",
        price: { toNumber: () => 19.99 },
      },
      acquiredAt: new Date("2024-01-01T00:00:00Z"),
    }));

    __setDependencies({
      UserRepository: {
        findUserById: mock.fn(async ({ id }) => ({ id, role: "USER" })),
      },
      GameRepository: {
        findGameById: mock.fn(async () => ({ id: "game-1" })),
      },
      UserGameRepository: {
        findByUserAndGame: mock.fn(async () => null),
        createUserGame,
      },
    });

    const entry = await addGameToLibrary({
      actor: { id: "user-1", role: "USER" },
      targetUserId: "user-1",
      gameId: "game-1",
    });

    assert.deepEqual(entry, {
      id: "game-1",
      title: "Test",
      platform: "PC",
      publisher: "Studio",
      price: 19.99,
      acquiredAt: "2024-01-01T00:00:00.000Z",
    });
    assert.equal(createUserGame.mock.callCount(), 1);
  });
});

describe("LibraryService.removeGameFromLibrary", () => {
  it("throws when entry missing", async () => {
    __setDependencies({
      UserRepository: {
        findUserById: mock.fn(async ({ id }) => ({ id, role: "USER" })),
      },
      UserGameRepository: {
        findByUserAndGame: mock.fn(async () => null),
      },
    });

    await assert.rejects(
      removeGameFromLibrary({
        actor: { id: "user-1", role: "USER" },
        targetUserId: "user-1",
        gameId: "game-1",
      }),
      { code: "LIBRARY_ENTRY_NOT_FOUND" },
    );
  });

  it("removes existing entry", async () => {
    const deleteUserGame = mock.fn(async () => ({}));

    __setDependencies({
      UserRepository: {
        findUserById: mock.fn(async ({ id }) => ({ id, role: "USER" })),
      },
      UserGameRepository: {
        findByUserAndGame: mock.fn(async () => ({
          game: { id: "game-1" },
          acquiredAt: new Date(),
        })),
        deleteUserGame,
      },
    });

    const result = await removeGameFromLibrary({
      actor: { id: "user-1", role: "USER" },
      targetUserId: "user-1",
      gameId: "game-1",
    });

    assert.deepEqual(result, { id: "game-1", deleted: true });
    assert.equal(deleteUserGame.mock.callCount(), 1);
  });
});
