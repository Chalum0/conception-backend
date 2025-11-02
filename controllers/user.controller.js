import { UserService } from "../services/index.service.js";

export const registerUser = async (req, res) => {
  const { email, password, displayName } = req.body ?? {};

  if (!email || !password || !displayName) {
    return res
      .status(400)
      .json({ message: "email, password and displayName are required." });
  }

  try {
    const user = await UserService.createUser({ email, password, displayName });
    return res.status(201).json({ id: user.id });
  } catch (error) {
    if (error.code === "USER_EMAIL_EXISTS") {
      return res.status(409).json({ message: "Email already in use." });
    }

    return res.status(500).json({ message: "Unable to register user." });
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
    } =
      await UserService.authenticateUser({ email, password });

    return res.status(200).json({
      userId,
      accessToken,
      accessTokenExpiresIn,
      refreshToken,
      refreshTokenExpiresAt,
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
    await UserService.logoutUser({ refreshToken });

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
