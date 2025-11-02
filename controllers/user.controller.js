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
