import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import {
  createUser,
  authenticateUser,
  logoutUser,
  refreshSession,
  changeUserRole,
  __setDependencies,
  __resetDependencies,
} from "../services/user.service.js";
import { authConfig } from "../config/config.js";

beforeEach(() => {
  mock.reset();
  __resetDependencies();
});

afterEach(() => {
  __resetDependencies();
  mock.reset();
});

describe("createUser", () => {
  it("throws when the email is already registered", async () => {
    const findUserByEmail = mock.fn(async () => ({ id: "existing-user" }));

    __setDependencies({
      UserRepository: {
        findUserByEmail,
      },
    });

    await assert.rejects(
      createUser({
        email: "taken@example.com",
        password: "secret",
        displayName: "Taken",
      }),
      { code: "USER_EMAIL_EXISTS" },
    );

    assert.equal(findUserByEmail.mock.callCount(), 1);
  });

  it("creates the first user as an admin with a hashed password", async () => {
    const findUserByEmail = mock.fn(async () => null);
    const countUsers = mock.fn(async () => 0);
    const createUserRepo = mock.fn(async (payload) => ({
      id: "user-1",
      ...payload,
    }));
    const hash = mock.fn(async (password, rounds) => {
      assert.equal(password, "secret");
      assert.equal(rounds, 12);
      return "hashed-secret";
    });

    __setDependencies({
      UserRepository: {
        findUserByEmail,
        countUsers,
        createUser: createUserRepo,
      },
      bcrypt: {
        hash,
      },
    });

    const result = await createUser({
      email: "first@example.com",
      password: "secret",
      displayName: "First",
    });

    assert.equal(result.role, "ADMIN");
    const callRecord = createUserRepo.mock.calls[0];
    assert.equal(callRecord.arguments[0].passwordHash, "hashed-secret");
    assert.equal(callRecord.arguments[0].role, "ADMIN");
  });

  it("creates subsequent users with the USER role", async () => {
    const createUserRepo = mock.fn(async (payload) => ({
      id: "user-2",
      ...payload,
    }));

    __setDependencies({
      UserRepository: {
        findUserByEmail: mock.fn(async () => null),
        countUsers: mock.fn(async () => 3),
        createUser: createUserRepo,
      },
      bcrypt: {
        hash: mock.fn(async () => "hashed"),
      },
    });

    const result = await createUser({
      email: "second@example.com",
      password: "secret",
      displayName: "Second",
    });

    assert.equal(result.role, "USER");
    const callRecord = createUserRepo.mock.calls[0];
    assert.equal(callRecord.arguments[0].role, "USER");
  });
});

describe("authenticateUser", () => {
  it("throws when the user does not exist", async () => {
    __setDependencies({
      UserRepository: {
        findUserByEmail: mock.fn(async () => null),
      },
    });

    await assert.rejects(
      authenticateUser({ email: "missing@example.com", password: "secret" }),
      { code: "AUTH_INVALID_CREDENTIALS" },
    );
  });

  it("throws when the password is invalid", async () => {
    __setDependencies({
      UserRepository: {
        findUserByEmail: mock.fn(async () => ({
          id: "user-1",
          email: "user@example.com",
          passwordHash: "hashed",
          role: "USER",
        })),
      },
      bcrypt: {
        compare: mock.fn(async () => false),
      },
    });

    await assert.rejects(
      authenticateUser({ email: "user@example.com", password: "wrong" }),
      { code: "AUTH_INVALID_CREDENTIALS" },
    );
  });

  it("returns access and refresh tokens for valid credentials", async () => {
    const refreshExpiresAt = new Date("2030-01-01T00:00:00.000Z");
    const createRefreshTokenRepo = mock.fn(async () => ({ id: "refresh-1" }));
    const generateRefreshTokenValue = mock.fn(() => "refresh-token");
    const hashToken = mock.fn((value) => `${value}-hash`);
    const addDurationToNow = mock.fn(() => refreshExpiresAt);
    const signAccessToken = mock.fn(() => "access-token");

    __setDependencies({
      UserRepository: {
        findUserByEmail: mock.fn(async () => ({
          id: "user-1",
          email: "user@example.com",
          passwordHash: "hashed",
          role: "USER",
        })),
      },
      bcrypt: {
        compare: mock.fn(async () => true),
      },
      RefreshTokenRepository: {
        createRefreshToken: createRefreshTokenRepo,
      },
      generateRefreshTokenValue,
      hashToken,
      addDurationToNow,
      signAccessToken,
    });

    const result = await authenticateUser({
      email: "user@example.com",
      password: "secret",
    });

    assert.equal(result.userId, "user-1");
    assert.equal(result.accessToken, "access-token");
    assert.equal(result.accessTokenExpiresIn, authConfig.jwtExpiresIn);
    assert.equal(result.refreshToken, "refresh-token");
    assert.equal(result.refreshTokenExpiresAt, refreshExpiresAt.toISOString());
    assert.equal(result.role, "USER");
    assert.equal(createRefreshTokenRepo.mock.callCount(), 1);
    const refreshCall = createRefreshTokenRepo.mock.calls[0];
    assert.equal(refreshCall.arguments[0].tokenHash, "refresh-token-hash");
  });
});

describe("logoutUser", () => {
  it("throws when refresh token is missing", async () => {
    await assert.rejects(logoutUser({}), { code: "LOGOUT_MISSING_TOKEN" });
  });

  it("returns revoked false when token record is missing", async () => {
    const hashToken = mock.fn(() => "missing-hash");
    const findRefreshTokenByHash = mock.fn(async () => null);

    __setDependencies({
      hashToken,
      RefreshTokenRepository: {
        findRefreshTokenByHash,
      },
    });

    const result = await logoutUser({ refreshToken: "missing" });

    assert.deepEqual(result, { revoked: false });
    assert.equal(hashToken.mock.callCount(), 1);
    assert.equal(findRefreshTokenByHash.mock.callCount(), 1);
  });

  it("revokes an active refresh token", async () => {
    const hashToken = mock.fn(() => "active-hash");
    const findRefreshTokenByHash = mock.fn(async () => ({
      id: "token-1",
      revokedAt: null,
    }));
    const revokeRefreshTokenByHash = mock.fn(async () => ({
      id: "token-1",
      revokedAt: new Date(),
    }));

    __setDependencies({
      hashToken,
      RefreshTokenRepository: {
        findRefreshTokenByHash,
        revokeRefreshTokenByHash,
      },
    });

    const result = await logoutUser({ refreshToken: "active" });

    assert.deepEqual(result, { revoked: true });
    assert.equal(hashToken.mock.callCount(), 1);
    assert.equal(findRefreshTokenByHash.mock.callCount(), 1);
    assert.equal(revokeRefreshTokenByHash.mock.callCount(), 1);
  });
});

describe("refreshSession", () => {
  it("throws when refresh token is missing", async () => {
    await assert.rejects(refreshSession({}), {
      code: "REFRESH_MISSING_TOKEN",
    });
  });

  it("throws when refresh token cannot be found", async () => {
    const hashToken = mock.fn(() => "missing-hash");
    const findRefreshTokenByHash = mock.fn(async () => null);

    __setDependencies({
      hashToken,
      RefreshTokenRepository: {
        findRefreshTokenByHash,
      },
    });

    await assert.rejects(
      refreshSession({ refreshToken: "missing" }),
      { code: "REFRESH_INVALID_TOKEN" },
    );

    assert.equal(hashToken.mock.callCount(), 1);
    assert.equal(findRefreshTokenByHash.mock.callCount(), 1);
  });

  it("renews tokens when the refresh token is valid", async () => {
    const providedToken = "refresh-token";
    const newRefreshToken = "new-refresh-token";
    const existingRecord = {
      id: "refresh-1",
      userId: "user-1",
      revokedAt: null,
      expiresAt: new Date("2030-01-01T00:00:00.000Z"),
    };
    const newExpiresAt = new Date("2030-06-01T00:00:00.000Z");

    const hashToken = mock.fn((value) => `${value}-hash`);
    const findRefreshTokenByHash = mock.fn(async ({ tokenHash }) => {
      assert.equal(tokenHash, `${providedToken}-hash`);
      return existingRecord;
    });
    const revokeRefreshTokenById = mock.fn(async () => ({
      id: existingRecord.id,
    }));
    const createRefreshToken = mock.fn(async (payload) => ({
      id: "refresh-2",
      ...payload,
    }));
    const findUserById = mock.fn(async () => ({
      id: "user-1",
      email: "user@example.com",
      role: "USER",
    }));
    const generateRefreshTokenValue = mock.fn(() => newRefreshToken);
    const addDurationToNow = mock.fn(() => newExpiresAt);
    const signAccessToken = mock.fn(() => "new-access-token");

    __setDependencies({
      hashToken,
      generateRefreshTokenValue,
      addDurationToNow,
      signAccessToken,
      RefreshTokenRepository: {
        findRefreshTokenByHash,
        revokeRefreshTokenById,
        createRefreshToken,
      },
      UserRepository: {
        findUserById,
      },
    });

    const result = await refreshSession({ refreshToken: providedToken });

    assert.equal(result.userId, "user-1");
    assert.equal(result.accessToken, "new-access-token");
    assert.equal(result.refreshToken, newRefreshToken);
    assert.equal(result.refreshTokenExpiresAt, newExpiresAt.toISOString());
    assert.equal(result.role, "USER");
    assert.equal(hashToken.mock.callCount(), 2);
    assert.equal(revokeRefreshTokenById.mock.callCount(), 1);
    assert.equal(createRefreshToken.mock.callCount(), 1);
    const createCall = createRefreshToken.mock.calls[0];
    assert.equal(createCall.arguments[0].tokenHash, `${newRefreshToken}-hash`);
  });
});

describe("changeUserRole", () => {
  it("throws when role is invalid", async () => {
    await assert.rejects(
      changeUserRole({
        actorId: "actor-1",
        targetUserId: "target-1",
        role: "moderator",
      }),
      { code: "ROLE_CHANGE_INVALID_ROLE" },
    );
  });

  it("throws when actor is not admin", async () => {
    __setDependencies({
      UserRepository: {
        findUserById: mock.fn(async ({ id }) => ({
          id,
          role: id === "actor-1" ? "USER" : "ADMIN",
        })),
      },
    });

    await assert.rejects(
      changeUserRole({
        actorId: "actor-1",
        targetUserId: "target-2",
        role: "ADMIN",
      }),
      { code: "ROLE_CHANGE_FORBIDDEN" },
    );
  });

  it("throws when target user does not exist", async () => {
    __setDependencies({
      UserRepository: {
        findUserById: mock.fn(async ({ id }) => {
          if (id === "actor-1") {
            return { id, role: "ADMIN" };
          }
          return null;
        }),
      },
    });

    await assert.rejects(
      changeUserRole({
        actorId: "actor-1",
        targetUserId: "missing",
        role: "ADMIN",
      }),
      { code: "ROLE_CHANGE_USER_NOT_FOUND" },
    );
  });

  it("prevents admins from demoting other users", async () => {
    __setDependencies({
      UserRepository: {
        findUserById: mock.fn(async ({ id }) => ({
          id,
          role: "ADMIN",
        })),
      },
    });

    await assert.rejects(
      changeUserRole({
        actorId: "actor-1",
        targetUserId: "target-2",
        role: "USER",
      }),
      { code: "ROLE_CHANGE_INVALID_TARGET" },
    );
  });

  it("allows admins to promote another user to admin", async () => {
    const findUserById = mock.fn(async ({ id }) => {
      if (id === "actor-1") {
        return { id, role: "ADMIN" };
      }
      return { id, role: "USER" };
    });
    const updateUserRole = mock.fn(async ({ id, role }) => ({
      id,
      role,
    }));

    __setDependencies({
      UserRepository: {
        findUserById,
        updateUserRole,
      },
    });

    const result = await changeUserRole({
      actorId: "actor-1",
      targetUserId: "target-2",
      role: "ADMIN",
    });

    assert.deepEqual(result, { id: "target-2", role: "ADMIN" });
    assert.equal(updateUserRole.mock.callCount(), 1);
  });

  it("allows admins to demote themselves", async () => {
    const findUserById = mock.fn(async ({ id }) => ({
      id,
      role: id === "actor-1" ? "ADMIN" : "USER",
    }));
    const updateUserRole = mock.fn(async ({ id, role }) => ({
      id,
      role,
    }));

    __setDependencies({
      UserRepository: {
        findUserById,
        updateUserRole,
      },
    });

    const result = await changeUserRole({
      actorId: "actor-1",
      targetUserId: "actor-1",
      role: "USER",
    });

    assert.deepEqual(result, { id: "actor-1", role: "USER" });
    assert.equal(updateUserRole.mock.callCount(), 1);
  });
});
