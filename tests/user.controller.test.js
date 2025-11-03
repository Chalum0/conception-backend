import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshSession,
  updateUserRole,
  __setServices,
  __resetServices,
} from "../controllers/user.controller.js";

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

  res.send = mock.fn((payload) => {
    res.body = payload;
    return res;
  });

  return res;
};

const createRequest = (body = {}, overrides = {}) => ({ body, ...overrides });

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

describe("registerUser", () => {
  it("returns 400 when required fields are missing", async () => {
    const req = createRequest({ email: "user@example.com" });
    const res = createResponse();

    await registerUser(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
      message: "email, password and displayName are required.",
    });
  });

  it("passes payload to the service and returns 201 on success", async () => {
    const createUser = mock.fn(async ({ email }) => ({
      id: "user-1",
      role: "USER",
      email,
    }));

    __setServices({ createUser });

    const req = createRequest({
      email: "user@example.com",
      password: "secret",
      displayName: "User",
    });
    const res = createResponse();

    await registerUser(req, res);

    assert.equal(createUser.mock.callCount(), 1);
    const call = createUser.mock.calls[0];
    assert.deepEqual(call.arguments[0], req.body);
    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body, { id: "user-1", role: "USER" });
  });

  it("returns 409 when the email already exists", async () => {
    const error = new Error("exists");
    error.code = "USER_EMAIL_EXISTS";
    const createUser = mock.fn(async () => {
      throw error;
    });

    __setServices({ createUser });

    const req = createRequest({
      email: "user@example.com",
      password: "secret",
      displayName: "User",
    });
    const res = createResponse();

    await registerUser(req, res);

    assert.equal(res.statusCode, 409);
    assert.deepEqual(res.body, { message: "Email already in use." });
  });

  it("returns 500 for unexpected errors", async () => {
    const createUser = mock.fn(async () => {
      throw new Error("boom");
    });
    __setServices({ createUser });

    const req = createRequest({
      email: "user@example.com",
      password: "secret",
      displayName: "User",
    });
    const res = createResponse();

    await registerUser(req, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { message: "Unable to register user." });
  });
});

describe("loginUser", () => {
  it("returns 400 when missing credentials", async () => {
    const res = createResponse();

    await loginUser(createRequest({ email: "user@example.com" }), res);
    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
      message: "email and password are required.",
    });
  });

  it("returns 200 with tokens on success", async () => {
    const authenticateUser = mock.fn(async () => ({
      userId: "user-1",
      accessToken: "access",
      accessTokenExpiresIn: "15m",
      refreshToken: "refresh",
      refreshTokenExpiresAt: "2030-01-01T00:00:00.000Z",
      role: "USER",
    }));

    __setServices({ authenticateUser });

    const req = createRequest({
      email: "user@example.com",
      password: "secret",
    });
    const res = createResponse();

    await loginUser(req, res);

    assert.equal(authenticateUser.mock.callCount(), 1);
    const call = authenticateUser.mock.calls[0];
    assert.deepEqual(call.arguments[0], req.body);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
      userId: "user-1",
      accessToken: "access",
      accessTokenExpiresIn: "15m",
      refreshToken: "refresh",
      refreshTokenExpiresAt: "2030-01-01T00:00:00.000Z",
      role: "USER",
    });
  });

  it("returns 401 on invalid credentials", async () => {
    const error = new Error("invalid");
    error.code = "AUTH_INVALID_CREDENTIALS";
    const authenticateUser = mock.fn(async () => {
      throw error;
    });

    __setServices({ authenticateUser });

    const res = createResponse();
    await loginUser(
      createRequest({ email: "user@example.com", password: "wrong" }),
      res,
    );

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, { message: "Invalid email or password." });
  });

  it("returns 500 for unexpected errors", async () => {
    const authenticateUser = mock.fn(async () => {
      throw new Error("boom");
    });
    __setServices({ authenticateUser });

    const res = createResponse();
    await loginUser(
      createRequest({ email: "user@example.com", password: "secret" }),
      res,
    );

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { message: "Unable to login user." });
    assert.equal(consoleErrorMock.mock.callCount(), 1);
  });
});

describe("logoutUser", () => {
  it("returns 400 when refreshToken missing", async () => {
    const res = createResponse();

    await logoutUser(createRequest({}), res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { message: "refreshToken is required." });
  });

  it("returns 204 on successful logout", async () => {
    const logoutService = mock.fn(async () => ({}));
    __setServices({ logoutUser: logoutService });

    const res = createResponse();
    await logoutUser(createRequest({ refreshToken: "token" }), res);

    assert.equal(logoutService.mock.callCount(), 1);
    assert.equal(res.statusCode, 204);
    assert.equal(res.send.mock.callCount(), 1);
  });

  it("returns 400 when service reports missing token", async () => {
    const error = new Error("missing");
    error.code = "LOGOUT_MISSING_TOKEN";
    const logoutService = mock.fn(async () => {
      throw error;
    });

    __setServices({ logoutUser: logoutService });

    const res = createResponse();
    await logoutUser(createRequest({ refreshToken: "token" }), res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { message: "refreshToken is required." });
  });

  it("returns 500 for unexpected errors", async () => {
    const logoutService = mock.fn(async () => {
      throw new Error("boom");
    });
    __setServices({ logoutUser: logoutService });

    const res = createResponse();
    await logoutUser(createRequest({ refreshToken: "token" }), res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { message: "Unable to logout user." });
    assert.equal(consoleErrorMock.mock.callCount(), 1);
  });
});

describe("refreshSession", () => {
  it("returns 400 when refreshToken missing", async () => {
    const res = createResponse();

    await refreshSession(createRequest({}), res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { message: "refreshToken is required." });
  });

  it("returns 200 with new tokens on success", async () => {
    const refreshService = mock.fn(async () => ({
      userId: "user-1",
      accessToken: "new-access",
      accessTokenExpiresIn: "15m",
      refreshToken: "new-refresh",
      refreshTokenExpiresAt: "2030-06-01T00:00:00.000Z",
      role: "USER",
    }));

    __setServices({ refreshSession: refreshService });

    const req = createRequest({ refreshToken: "token" });
    const res = createResponse();

    await refreshSession(req, res);

    assert.equal(refreshService.mock.callCount(), 1);
    const call = refreshService.mock.calls[0];
    assert.deepEqual(call.arguments[0], { refreshToken: "token" });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
      userId: "user-1",
      accessToken: "new-access",
      accessTokenExpiresIn: "15m",
      refreshToken: "new-refresh",
      refreshTokenExpiresAt: "2030-06-01T00:00:00.000Z",
      role: "USER",
    });
  });

  it("returns 401 when token is invalid", async () => {
    const error = new Error("invalid");
    error.code = "REFRESH_INVALID_TOKEN";
    const refreshService = mock.fn(async () => {
      throw error;
    });

    __setServices({ refreshSession: refreshService });

    const res = createResponse();
    await refreshSession(createRequest({ refreshToken: "token" }), res);

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, { message: "Invalid refresh token." });
  });

  it("returns 401 when token expired", async () => {
    const error = new Error("expired");
    error.code = "REFRESH_TOKEN_EXPIRED";
    const refreshService = mock.fn(async () => {
      throw error;
    });

    __setServices({ refreshSession: refreshService });

    const res = createResponse();
    await refreshSession(createRequest({ refreshToken: "token" }), res);

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, { message: "Refresh token expired." });
  });

  it("returns 500 for unexpected errors", async () => {
    const refreshService = mock.fn(async () => {
      throw new Error("boom");
    });

    __setServices({ refreshSession: refreshService });

    const res = createResponse();
    await refreshSession(createRequest({ refreshToken: "token" }), res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { message: "Unable to refresh session." });
    assert.equal(consoleErrorMock.mock.callCount(), 1);
  });
});

describe("updateUserRole", () => {
  it("returns 400 when role is missing", async () => {
    const res = createResponse();
    const req = createRequest({}, { params: { id: "user-1" }, user: { id: "actor-1" } });

    await updateUserRole(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { message: "role is required." });
  });

  it("returns 400 when user id param is missing", async () => {
    const res = createResponse();
    const req = createRequest({ role: "ADMIN" }, { user: { id: "actor-1" } });

    await updateUserRole(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { message: "User id is required." });
  });

  it("returns 200 when the service updates the role", async () => {
    const changeUserRole = mock.fn(async () => ({ id: "user-1", role: "ADMIN" }));
    __setServices({ changeUserRole });

    const res = createResponse();
    const req = createRequest(
      { role: "ADMIN" },
      { params: { id: "user-1" }, user: { id: "actor-1" } },
    );

    await updateUserRole(req, res);

    assert.equal(changeUserRole.mock.callCount(), 1);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { id: "user-1", role: "ADMIN" });
  });

  it("returns 400 when service rejects invalid role", async () => {
    const error = new Error("invalid");
    error.code = "ROLE_CHANGE_INVALID_ROLE";
    const changeUserRole = mock.fn(async () => {
      throw error;
    });
    __setServices({ changeUserRole });

    const res = createResponse();
    const req = createRequest(
      { role: "moderator" },
      { params: { id: "user-1" }, user: { id: "actor-1" } },
    );

    await updateUserRole(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { message: "Role must be ADMIN or USER." });
  });

  it("returns 403 when actor is not admin", async () => {
    const error = new Error("forbidden");
    error.code = "ROLE_CHANGE_FORBIDDEN";
    const changeUserRole = mock.fn(async () => {
      throw error;
    });
    __setServices({ changeUserRole });

    const res = createResponse();
    const req = createRequest(
      { role: "ADMIN" },
      { params: { id: "user-1" }, user: { id: "actor-1" } },
    );

    await updateUserRole(req, res);

    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, { message: "Admin access required." });
  });

  it("returns 404 when target user not found", async () => {
    const error = new Error("missing");
    error.code = "ROLE_CHANGE_USER_NOT_FOUND";
    const changeUserRole = mock.fn(async () => {
      throw error;
    });
    __setServices({ changeUserRole });

    const res = createResponse();
    const req = createRequest(
      { role: "ADMIN" },
      { params: { id: "user-1" }, user: { id: "actor-1" } },
    );

    await updateUserRole(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { message: "User not found." });
  });

  it("returns 400 when admin attempts to demote another user", async () => {
    const error = new Error("invalid target");
    error.code = "ROLE_CHANGE_INVALID_TARGET";
    const changeUserRole = mock.fn(async () => {
      throw error;
    });
    __setServices({ changeUserRole });

    const res = createResponse();
    const req = createRequest(
      { role: "USER" },
      { params: { id: "user-2" }, user: { id: "actor-1" } },
    );

    await updateUserRole(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { message: "Admins may only demote themselves." });
  });

  it("returns 500 when an unexpected error occurs", async () => {
    const changeUserRole = mock.fn(async () => {
      throw new Error("boom");
    });
    __setServices({ changeUserRole });

    const res = createResponse();
    const req = createRequest(
      { role: "ADMIN" },
      { params: { id: "user-1" }, user: { id: "actor-1" } },
    );

    await updateUserRole(req, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { message: "Unable to update user role." });
    assert.equal(consoleErrorMock.mock.callCount(), 1);
  });
});
