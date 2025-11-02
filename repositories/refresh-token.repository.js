import { RefreshTokenModel } from "../models/refresh-token.model.js";

export function createRefreshToken({ userId, tokenHash, expiresAt }) {
  return RefreshTokenModel.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });
}

export function findRefreshTokenByHash({ tokenHash }) {
  return RefreshTokenModel.findUnique({
    where: { tokenHash },
  });
}

export function revokeRefreshTokenByHash({ tokenHash, revokedAt = new Date() }) {
  return RefreshTokenModel.update({
    where: { tokenHash },
    data: { revokedAt },
  });
}
