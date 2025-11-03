import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import gameRouter from "../../routers/game.router.js";
import {
  __setServices as setGameServices,
  __resetServices as resetGameServices,
} from "../../controllers/game.controller.js";
import { __resetServices as resetUserServices } from "../../controllers/user.controller.js";
import {
  __setDependencies as setAuthDependencies,
  __resetDependencies as resetAuthDependencies,
} from "../../middlewares/auth.middleware.js";

const findRouteHandlers = (router, method, path) => {
  const lowerMethod = method.toLowerCase();

  for (const layer of router.stack) {
    if (layer.route && layer.route.path === path) {
      const matchingLayers = layer.route.stack.filter(
        (routeLayer) => routeLayer.method === lowerMethod,
      );

      if (matchingLayers.length > 0) {
        return matchingLayers.map((routeLayer) => routeLayer.handle);
      }
    }
  }

  throw new Error(`Route ${method} ${path} not found on router`);
};

const runHandlers = async (handlers, req, res) => {
  let index = 0;

  const dispatch = async (error) => {
    if (error) {
      throw error;
    }

    if (index >= handlers.length) {
      return;
    }

    const handler = handlers[index++];
    let nextCalled = false;

    const next = (err) => {
      nextCalled = true;
      return dispatch(err);
    };

    const maybePromise = handler(req, res, next);

    await Promise.resolve(maybePromise);

    if (handler.length < 3 && !nextCalled) {
      await dispatch();
    }
  };

  await dispatch();
};

const createResponse = () => {
  const res = {
    statusCode: 200,
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

  res.send = mock.fn((payload) => {
    res.body = payload;
    return res;
  });

  return res;
};

const createRequest = ({ method = "GET", path = "/", headers = {}, body } = {}) => {
  const req = {
    method,
    url: path,
    path,
    params: {},
    headers: {},
    body,
  };

  for (const [key, value] of Object.entries(headers)) {
    req.headers[key] = value;
    req.headers[key.toLowerCase()] = value;
  }

  return req;
};

beforeEach(() => {
  mock.restoreAll();
  mock.reset();
  resetGameServices();
  resetUserServices();
  resetAuthDependencies();
  mock.method(console, "error", () => {});
});

afterEach(() => {
  mock.restoreAll();
  mock.reset();
  resetGameServices();
  resetUserServices();
  resetAuthDependencies();
});

describe("API integration routes", () => {
  it("GET /api/games returns the game list", async () => {
    const games = [
      { id: "game-1", title: "First Game", platform: "PC" },
      { id: "game-2", title: "Second Game", platform: "Console" },
    ];
    const listGames = mock.fn(async () => games);

    setGameServices({ listGames });

    const handlers = findRouteHandlers(gameRouter, "get", "/games");
    const req = createRequest({ method: "GET", path: "/games" });
    const res = createResponse();

    await runHandlers(handlers, req, res);

    assert.equal(listGames.mock.callCount(), 1);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, games);
  });

  it("POST /api/games rejects missing authorization header", async () => {
    const createGame = mock.fn(async () => {
      throw new Error("should not be called without auth");
    });
    setGameServices({ createGame });

    const handlers = findRouteHandlers(gameRouter, "post", "/games");
    const req = createRequest({
      method: "POST",
      path: "/games",
      body: {
        title: "Game",
        platform: "PC",
        price: 19.99,
        publisher: "Studio",
      },
    });
    const res = createResponse();

    await runHandlers(handlers, req, res);

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, { message: "Authorization header missing." });
    assert.equal(createGame.mock.callCount(), 0);
  });

  it("POST /api/games denies non-admin users", async () => {
    const createGame = mock.fn(async () => {
      throw new Error("should not be called for non-admin");
    });
    setGameServices({ createGame });

    const verifyAccessToken = mock.fn(() => ({
      sub: "user-1",
      email: "user@example.com",
      role: "USER",
    }));
    setAuthDependencies({ verifyAccessToken });

    const handlers = findRouteHandlers(gameRouter, "post", "/games");
    const req = createRequest({
      method: "POST",
      path: "/games",
      headers: { Authorization: "Bearer fake-token" },
      body: {
        title: "Game",
        platform: "PC",
        price: 19.99,
        publisher: "Studio",
      },
    });
    const res = createResponse();

    await runHandlers(handlers, req, res);

    assert.equal(verifyAccessToken.mock.callCount(), 1);
    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, { message: "Admin access required." });
    assert.equal(createGame.mock.callCount(), 0);
  });

  it("POST /api/games creates a game for admin users", async () => {
    const createGame = mock.fn(async (payload) => ({
      id: "game-99",
      ...payload,
    }));
    setGameServices({ createGame });

    const verifyAccessToken = mock.fn(() => ({
      sub: "admin-1",
      email: "admin@example.com",
      role: "ADMIN",
    }));
    setAuthDependencies({ verifyAccessToken });

    const handlers = findRouteHandlers(gameRouter, "post", "/games");
    const payload = {
      title: "New Game",
      platform: "PC",
      price: 29.99,
      publisher: "Studio",
    };
    const req = createRequest({
      method: "POST",
      path: "/games",
      headers: { Authorization: "Bearer admin-token" },
      body: payload,
    });
    const res = createResponse();

    await runHandlers(handlers, req, res);

    assert.equal(verifyAccessToken.mock.callCount(), 1);
    assert.equal(createGame.mock.callCount(), 1);
    assert.deepEqual(createGame.mock.calls[0].arguments[0], payload);
    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body, {
      id: "game-99",
      ...payload,
    });
  });
});
