import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import {
  listUserLibrary,
  addGameToLibrary,
  removeGameFromLibrary,
  __setServices,
  __resetServices,
} from "../controllers/library.controller.js";

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

describe("LibraryController.listUserLibrary", () => {
  it("returns games on success", async () => {
    const listLibraryService = mock.fn(async () => [{ id: "game-1" }]);
    __setServices({ listLibrary: listLibraryService });

    const res = createResponse();
    const req = createRequest({
      params: { id: "user-1" },
      user: { id: "user-1", role: "USER" },
    });

    await listUserLibrary(req, res);

    assert.equal(listLibraryService.mock.callCount(), 1);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, [{ id: "game-1" }]);
  });

  it("returns 404 when user missing", async () => {
    const listLibraryService = mock.fn(async () => {
      const error = new Error("missing");
      error.code = "LIBRARY_USER_NOT_FOUND";
      throw error;
    });
    __setServices({ listLibrary: listLibraryService });

    const res = createResponse();
    const req = createRequest({
      params: { id: "user-1" },
      user: { id: "admin-1", role: "ADMIN" },
    });

    await listUserLibrary(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { message: "User not found." });
  });
});

describe("LibraryController.addGameToLibrary", () => {
  it("returns 201 on success", async () => {
    const addService = mock.fn(async () => ({ id: "game-1" }));
    __setServices({ addGameToLibrary: addService });

    const res = createResponse();
    const req = createRequest({
      params: { id: "user-1" },
      user: { id: "user-1", role: "USER" },
      body: { gameId: "game-1" },
    });

    await addGameToLibrary(req, res);

    assert.equal(addService.mock.callCount(), 1);
    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body, { id: "game-1" });
  });

  it("returns 409 when duplicate", async () => {
    const error = new Error("duplicate");
    error.code = "LIBRARY_DUPLICATE";
    const addService = mock.fn(async () => {
      throw error;
    });
    __setServices({ addGameToLibrary: addService });

    const res = createResponse();
    const req = createRequest({
      params: { id: "user-1" },
      user: { id: "user-1", role: "USER" },
      body: { gameId: "game-1" },
    });

    await addGameToLibrary(req, res);

    assert.equal(res.statusCode, 409);
    assert.deepEqual(res.body, { message: "Game already in library." });
  });
});

describe("LibraryController.removeGameFromLibrary", () => {
  it("returns 200 on success", async () => {
    const removeService = mock.fn(async () => ({ id: "game-1", deleted: true }));
    __setServices({ removeGameFromLibrary: removeService });

    const res = createResponse();
    const req = createRequest({
      params: { id: "user-1", gameId: "game-1" },
      user: { id: "user-1", role: "USER" },
    });

    await removeGameFromLibrary(req, res);

    assert.equal(removeService.mock.callCount(), 1);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { id: "game-1", deleted: true });
  });

  it("returns 404 when entry missing", async () => {
    const error = new Error("missing");
    error.code = "LIBRARY_ENTRY_NOT_FOUND";
    const removeService = mock.fn(async () => {
      throw error;
    });
    __setServices({ removeGameFromLibrary: removeService });

    const res = createResponse();
    const req = createRequest({
      params: { id: "user-1", gameId: "game-1" },
      user: { id: "user-1", role: "USER" },
    });

    await removeGameFromLibrary(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { message: "Game not found in user library." });
  });

  it("returns 500 on unexpected error", async () => {
    const removeService = mock.fn(async () => {
      throw new Error("boom");
    });
    __setServices({ removeGameFromLibrary: removeService });

    const res = createResponse();
    const req = createRequest({
      params: { id: "user-1", gameId: "game-1" },
      user: { id: "user-1", role: "USER" },
    });

    await removeGameFromLibrary(req, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { message: "Unable to remove game from library." });
    assert.equal(consoleErrorMock.mock.callCount(), 1);
  });
});
