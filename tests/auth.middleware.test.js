import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import {
  authenticateAccessToken,
  requireAdmin,
  __setDependencies,
  __resetDependencies,
} from "../middlewares/auth.middleware.js";

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
  __resetDependencies();
  consoleErrorMock = mock.method(console, "error", () => {});
});

afterEach(() => {
  mock.restoreAll();
  mock.reset();
  __resetDependencies();
});

describe("authenticateAccessToken", () => {
  it("returns 401 when authorization header is missing", () => {
    const req = { headers: {} };
    const res = createResponse();
    const next = mock.fn();

    authenticateAccessToken(req, res, next);

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, { message: "Authorization header missing." });
    assert.equal(next.mock.callCount(), 0);
  });

  it("returns 401 when authorization header is malformed", () => {
    const req = { headers: { authorization: "Token abc" } };
    const res = createResponse();
    const next = mock.fn();

    authenticateAccessToken(req, res, next);

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, { message: "Authorization header malformed." });
    assert.equal(next.mock.callCount(), 0);
  });

  it("returns 401 when token verification fails", () => {
    __setDependencies({
      verifyAccessToken: () => {
        throw new Error("invalid");
      },
    });

    const req = { headers: { authorization: "Bearer badtoken" } };
    const res = createResponse();
    const next = mock.fn();

    authenticateAccessToken(req, res, next);

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, { message: "Invalid or expired token." });
    assert.equal(consoleErrorMock.mock.callCount(), 1);
    assert.equal(next.mock.callCount(), 0);
  });

  it("attaches user info and calls next when token is valid", () => {
    __setDependencies({
      verifyAccessToken: () => ({
        sub: "user-1",
        email: "user@example.com",
        role: "ADMIN",
      }),
    });

    const req = { headers: { authorization: "Bearer token" } };
    const res = createResponse();
    const next = mock.fn();

    authenticateAccessToken(req, res, next);

    assert.deepEqual(req.user, {
      id: "user-1",
      email: "user@example.com",
      role: "ADMIN",
    });
    assert.equal(next.mock.callCount(), 1);
    assert.equal(res.statusCode, null);
  });
});

describe("requireAdmin", () => {
  it("returns 403 when user is not admin", () => {
    const req = { user: { id: "user-1", role: "USER" } };
    const res = createResponse();
    const next = mock.fn();

    requireAdmin(req, res, next);

    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, { message: "Admin access required." });
    assert.equal(next.mock.callCount(), 0);
  });

  it("calls next when user is admin", () => {
    const req = { user: { id: "user-1", role: "ADMIN" } };
    const res = createResponse();
    const next = mock.fn();

    requireAdmin(req, res, next);

    assert.equal(next.mock.callCount(), 1);
    assert.equal(res.statusCode, null);
  });
});
