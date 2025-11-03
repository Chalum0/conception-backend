import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import {
  getGameConfig,
  saveGameConfig,
  listGameConfigs,
  __setServices,
  __resetServices,
} from "../controllers/game-config.controller.js";

const createResponse = () => {
  const res = {
    statusCode: null,
    body: undefined,
  };

  res.status = mock.fn((code) => {
    res.statusCode = code;
    return res;
  });

  res.json = mock.fn((payload) => {
    res.body = payload;
    return res;
  });

  return res;
};

const createRequest = (overrides = {}) => ({ ...overrides });

let consoleErrorMock;

beforeEach(() => {
  mock.restoreAll();
  mock.reset();
  __resetServices();
  consoleErrorMock = mock.method(console, "error", () => {});
});

afterEach(() => {
  mock.restoreAll();
  mock.reset();
  __resetServices();
});

describe("GameConfigController.getGameConfig", () => {
  it("returns 400 when admin omits user id", async () => {
    const res = createResponse();
    const req = createRequest({
      params: {},
      user: { id: "admin-1", role: "ADMIN" },
    });

    await getGameConfig(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { message: "User id is required." });
  });

  it("returns config for self user", async () => {
    const getService = mock.fn(async () => ({ id: "cfg-1" }));
    __setServices({ getGameConfig: getService });

    const res = createResponse();
    const req = createRequest({
      params: { id: "user-1", gameId: "game-1" },
      user: { id: "user-1", role: "USER" },
    });

    await getGameConfig(req, res);

    assert.equal(getService.mock.callCount(), 1);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { id: "cfg-1" });
  });

  it("returns 404 when service returns null", async () => {
    const getService = mock.fn(async () => null);
    __setServices({ getGameConfig: getService });

    const res = createResponse();
    const req = createRequest({
      params: { id: "user-1", gameId: "game-1" },
      user: { id: "user-1", role: "USER" },
    });

    await getGameConfig(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { message: "Game configuration not found." });
  });
});

describe("GameConfigController.saveGameConfig", () => {
  it("returns 403 when service forbids", async () => {
    const err = new Error("forbidden");
    err.code = "GAME_CONFIG_FORBIDDEN";
    const saveService = mock.fn(async () => {
      throw err;
    });
    __setServices({ saveGameConfig: saveService });

    const res = createResponse();
    const req = createRequest({
      params: { id: "user-1", gameId: "game-1" },
      user: { id: "admin-1", role: "ADMIN" },
      body: { quality: "low" },
    });

    await saveGameConfig(req, res);

    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, { message: "Access forbidden." });
  });

  it("saves settings for self user", async () => {
    const saveService = mock.fn(async () => ({ id: "cfg-1" }));
    __setServices({ saveGameConfig: saveService });

    const res = createResponse();
    const req = createRequest({
      params: { id: "user-1", gameId: "game-1" },
      user: { id: "user-1", role: "USER" },
      body: { quality: "ultra" },
    });

    await saveGameConfig(req, res);

    assert.equal(saveService.mock.callCount(), 1);
    const call = saveService.mock.calls[0];
    assert.deepEqual(call.arguments[0].settings, { quality: "ultra" });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { id: "cfg-1" });
  });
});

describe("GameConfigController.listGameConfigs", () => {
  it("returns 400 when admin omits user id", async () => {
    const listService = mock.fn(async () => []);
    __setServices({ listGameConfigsForUser: listService });

    const res = createResponse();
    const req = createRequest({
      params: {},
      user: { id: "admin-1", role: "ADMIN" },
    });

    await listGameConfigs(req, res);

    assert.equal(listService.mock.callCount(), 0);
    assert.equal(res.statusCode, 400);
  });

  it("returns configs for self user", async () => {
    const listService = mock.fn(async () => [{ id: "cfg-1" }]);
    __setServices({ listGameConfigsForUser: listService });

    const res = createResponse();
    const req = createRequest({
      params: { id: "user-1" },
      user: { id: "user-1", role: "USER" },
    });

    await listGameConfigs(req, res);

    assert.equal(listService.mock.callCount(), 1);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, [{ id: "cfg-1" }]);
  });

  it("returns 500 on unexpected error", async () => {
    const listService = mock.fn(async () => {
      throw new Error("boom");
    });
    __setServices({ listGameConfigsForUser: listService });

    const res = createResponse();
    const req = createRequest({
      params: { id: "user-1" },
      user: { id: "user-1", role: "USER" },
    });

    await listGameConfigs(req, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { message: "Unable to list game configurations." });
    assert.equal(consoleErrorMock.mock.callCount(), 1);
  });
});
