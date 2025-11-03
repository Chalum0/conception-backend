import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import {
  listGames as listGamesController,
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
