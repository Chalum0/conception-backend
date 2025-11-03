import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import {
  listGames as listGamesController,
  createGame as createGameController,
  __setServices,
  __resetServices,
} from "../controllers/game.controller.js";

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

const createRequest = (body = {}) => ({ body });

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

describe("GameController.listGames", () => {
  it("returns games from the service", async () => {
    const games = [{ id: "1", title: "Game", platform: "PC" }];
    const listGames = mock.fn(async () => games);
    __setServices({ listGames });

    const res = createResponse();
    await listGamesController({}, res);

    assert.equal(listGames.mock.callCount(), 1);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, games);
  });

  it("returns 500 when service fails", async () => {
    const listGames = mock.fn(async () => {
      throw new Error("boom");
    });
    __setServices({ listGames });

    const res = createResponse();
    await listGamesController({}, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { message: "Unable to fetch games." });
    assert.equal(consoleErrorMock.mock.callCount(), 1);
  });
});

describe("GameController.createGame", () => {
  it("returns 201 on success", async () => {
    const createGame = mock.fn(async (payload) => ({
      id: "game-1",
      ...payload,
    }));
    __setServices({ createGame });

    const req = createRequest({
      title: "Game",
      platform: "PC",
      price: 19.99,
      publisher: "Studio",
    });
    const res = createResponse();

    await createGameController(req, res);

    assert.equal(createGame.mock.callCount(), 1);
    assert.equal(res.statusCode, 201);
    assert.equal(res.json.mock.calls[0].arguments[0].id, "game-1");
  });

  it("returns 400 when validation fails", async () => {
    const error = new Error("title is required.");
    error.code = "GAME_INVALID_TITLE";
    const createGame = mock.fn(async () => {
      throw error;
    });
    __setServices({ createGame });

    const req = createRequest({});
    const res = createResponse();

    await createGameController(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { message: "title is required." });
  });

  it("returns 500 on unexpected errors", async () => {
    const createGame = mock.fn(async () => {
      throw new Error("boom");
    });
    __setServices({ createGame });

    const req = createRequest({
      title: "Game",
      platform: "PC",
      price: 10,
      publisher: "Studio",
    });
    const res = createResponse();

    await createGameController(req, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { message: "Unable to create game." });
    assert.equal(consoleErrorMock.mock.callCount(), 1);
  });
});
