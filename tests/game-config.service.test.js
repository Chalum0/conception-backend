import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import {
  saveGameConfig,
  getGameConfig,
  listGameConfigsForUser,
  removeGameConfig,
  __setDependencies,
  __resetDependencies,
} from "../services/game-config.service.js";

beforeEach(() => {
  __resetDependencies();
  mock.reset();
});

afterEach(() => {
  __resetDependencies();
  mock.reset();
});

describe("GameConfigService.saveGameConfig", () => {
  it("throws when userId missing", async () => {
    await assert.rejects(
      saveGameConfig({ userId: "", gameId: "game-1", settings: {} }),
      { code: "GAME_CONFIG_INVALID_USER" },
    );
  });

  it("throws when settings invalid", async () => {
    await assert.rejects(
      saveGameConfig({ userId: "user-1", gameId: "game-1", settings: [] }),
      { code: "GAME_CONFIG_INVALID_SETTINGS" },
    );
  });

  it("upserts config with normalized identifiers", async () => {
    const upsert = mock.fn(async (payload) => ({
      id: "cfg-1",
      ...payload,
    }));

    __setDependencies({
      GameConfigRepository: {
        upsertGameConfig: upsert,
      },
    });

    const result = await saveGameConfig({
      userId: " user-1 ",
      gameId: " game-1 ",
      settings: { maxFps: 120 },
    });

    assert.equal(upsert.mock.callCount(), 1);
    const call = upsert.mock.calls[0];
    assert.equal(call.arguments[0].userId, "user-1");
    assert.equal(call.arguments[0].gameId, "game-1");
    assert.deepEqual(call.arguments[0].settings, { maxFps: 120 });
    assert.equal(result.id, "cfg-1");
  });
});

describe("GameConfigService.getGameConfig", () => {
  it("returns repository result", async () => {
    const record = { id: "cfg-1" };
    __setDependencies({
      GameConfigRepository: {
        findGameConfig: mock.fn(async () => record),
      },
    });

    const result = await getGameConfig({
      userId: "user-1",
      gameId: "game-1",
    });

    assert.strictEqual(result, record);
  });
});

describe("GameConfigService.listGameConfigsForUser", () => {
  it("throws when userId missing", async () => {
    await assert.rejects(listGameConfigsForUser({ userId: "" }), {
      code: "GAME_CONFIG_INVALID_USER",
    });
  });

  it("returns configs for user", async () => {
    const list = mock.fn(async () => [{ id: "cfg-1" }]);

    __setDependencies({
      GameConfigRepository: {
        listGameConfigsByUser: list,
      },
    });

    const result = await listGameConfigsForUser({ userId: "user-1" });

    assert.equal(list.mock.callCount(), 1);
    assert.deepEqual(result, [{ id: "cfg-1" }]);
  });
});

describe("GameConfigService.removeGameConfig", () => {
  it("calls delete and returns confirmation", async () => {
    const del = mock.fn(async () => ({}));

    __setDependencies({
      GameConfigRepository: {
        deleteGameConfig: del,
      },
    });

    const result = await removeGameConfig({
      userId: "user-1",
      gameId: "game-1",
    });

    assert.equal(del.mock.callCount(), 1);
    assert.deepEqual(result, {
      userId: "user-1",
      gameId: "game-1",
      deleted: true,
    });
  });
});
