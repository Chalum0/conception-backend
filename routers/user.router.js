import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshSession,
  updateUserRole,
} from "../controllers/user.controller.js";
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

export default userRouter;
