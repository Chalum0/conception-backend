import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshSession,
  updateUserRole,
  deleteUser,
} from "../controllers/user.controller.js";
import {
  listUserLibrary,
  addGameToLibrary,
  removeGameFromLibrary,
} from "../controllers/library.controller.js";
import {
  listGameConfigs,
  getGameConfig,
  saveGameConfig,
} from "../controllers/game-config.controller.js";
import {
  authenticateAccessToken,
  requireAdmin,
} from "../middlewares/auth.middleware.js";

const userRouter = express.Router();

userRouter.post("/auth/register", registerUser);
userRouter.post("/auth/login", loginUser);
userRouter.post("/auth/logout", logoutUser);
userRouter.post("/auth/refresh", refreshSession);
userRouter.patch(
  "/users/:id/role",
  authenticateAccessToken,
  requireAdmin,
  updateUserRole,
);
userRouter.delete(
  "/users/:id",
  authenticateAccessToken,
  requireAdmin,
  deleteUser,
);
userRouter.get(
  "/users/:id/games",
  authenticateAccessToken,
  listUserLibrary,
);
userRouter.post(
  "/users/:id/games",
  authenticateAccessToken,
  addGameToLibrary,
);
userRouter.get(
  "/users/:id/games/configs",
  authenticateAccessToken,
  listGameConfigs,
);
userRouter.get(
  "/users/:id/games/:gameId/config",
  authenticateAccessToken,
  getGameConfig,
);
userRouter.put(
  "/users/:id/games/:gameId/config",
  authenticateAccessToken,
  saveGameConfig,
);
userRouter.delete(
  "/users/:id/games/:gameId",
  authenticateAccessToken,
  removeGameFromLibrary,
);

export default userRouter;
