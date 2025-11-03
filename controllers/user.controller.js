import { UserService } from "../services/index.service.js";

let services = UserService;

export const __setServices = (overrides = {}) => {
  services = { ...UserService, ...overrides };
};

export const __resetServices = () => {
  services = UserService;
};

export const registerUser = async (req, res) => {
  const { email, password, displayName } = req.body ?? {};

  if (!email || !password || !displayName) {
    return res
      .status(400)
      .json({ message: "email, password and displayName are required." });
  }

  try {
    const user = await services.createUser({
      email,
      password,
      displayName,
    });
    return res.status(201).json({ id: user.id, role: user.role });
  } catch (error) {
    if (error.code === "USER_EMAIL_EXISTS") {
      return res.status(409).json({ message: "Email already in use." });
    }

    return res.status(500).json({ message: "Unable to register user." });
  }
};

export const deleteUser = async (req, res) => {
  const targetUserId = req.params?.id;

  try {
    const result = await services.deleteUser({
      actorId: req.user?.id,
      targetUserId,
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error.code === "DELETE_USER_INVALID_TARGET") {
      return res.status(400).json({ message: "User id is required." });
    }

    if (error.code === "DELETE_USER_FORBIDDEN") {
      return res.status(403).json({ message: "Admin access required." });
    }

    if (error.code === "DELETE_USER_NOT_FOUND") {
      return res.status(404).json({ message: "User not found." });
    }

    if (error.code === "DELETE_USER_ADMIN_BLOCKED") {
      return res.status(400).json({ message: "Cannot delete admin accounts." });
    }

    console.error("deleteUser error:", error);
    return res.status(500).json({ message: "Unable to delete user." });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "email and password are required." });
  }

  try {
    const {
      userId,
      accessToken,
      accessTokenExpiresIn,
      refreshToken,
      refreshTokenExpiresAt,
      role,
    } = await services.authenticateUser({ email, password });

    return res.status(200).json({
      userId,
      accessToken,
      accessTokenExpiresIn,
      refreshToken,
      refreshTokenExpiresAt,
      role,
    });
  } catch (error) {
    if (error.code === "AUTH_INVALID_CREDENTIALS") {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    console.error("loginUser error:", error);
    return res.status(500).json({ message: "Unable to login user." });
  }
};

export const logoutUser = async (req, res) => {
  const { refreshToken } = req.body ?? {};

  if (!refreshToken) {
    return res
      .status(400)
      .json({ message: "refreshToken is required." });
  }

  try {
    await services.logoutUser({ refreshToken });

    return res.status(204).send();
  } catch (error) {
    if (error.code === "LOGOUT_MISSING_TOKEN") {
      return res.status(400).json({ message: "refreshToken is required." });
    }

    console.error("logoutUser error:", error);
    return res.status(500).json({
      message: "Unable to logout user.",
    });
  }
};

export const refreshSession = async (req, res) => {
  const { refreshToken } = req.body ?? {};

  if (!refreshToken) {
    return res
      .status(400)
      .json({ message: "refreshToken is required." });
  }

  try {
    const {
      userId,
      accessToken,
      accessTokenExpiresIn,
      refreshToken: newRefreshToken,
      refreshTokenExpiresAt,
      role,
    } = await services.refreshSession({ refreshToken });

    return res.status(200).json({
      userId,
      accessToken,
      accessTokenExpiresIn,
      refreshToken: newRefreshToken,
      refreshTokenExpiresAt,
      role,
    });
  } catch (error) {
    if (
      error.code === "REFRESH_MISSING_TOKEN" ||
      error.code === "REFRESH_INVALID_TOKEN"
    ) {
      return res.status(401).json({ message: "Invalid refresh token." });
    }

    if (error.code === "REFRESH_TOKEN_EXPIRED") {
      return res.status(401).json({ message: "Refresh token expired." });
    }

    console.error("refreshSession error:", error);
    return res.status(500).json({ message: "Unable to refresh session." });
  }
};

export const updateUserRole = async (req, res) => {
  const { role } = req.body ?? {};
  const targetUserId = req.params?.id;

  if (!role) {
    return res.status(400).json({ message: "role is required." });
  }

  if (!targetUserId) {
    return res.status(400).json({ message: "User id is required." });
  }

  try {
    const result = await services.changeUserRole({
      actorId: req.user?.id,
      targetUserId,
      role,
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error.code === "ROLE_CHANGE_INVALID_ROLE") {
      return res
        .status(400)
        .json({ message: "Role must be ADMIN or USER." });
    }

    if (error.code === "ROLE_CHANGE_FORBIDDEN") {
      return res.status(403).json({ message: "Admin access required." });
    }

    if (error.code === "ROLE_CHANGE_USER_NOT_FOUND") {
      return res.status(404).json({ message: "User not found." });
    }

    if (error.code === "ROLE_CHANGE_INVALID_TARGET") {
      return res
        .status(400)
        .json({ message: "Admins may only demote themselves." });
    }

    console.error("updateUserRole error:", error);
    return res.status(500).json({ message: "Unable to update user role." });
  }
};
