import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshSession,
} from "../controllers/user.controller.js";

const userRouter = express.Router();

userRouter.post("/auth/register", registerUser);
userRouter.post("/auth/login", loginUser);
userRouter.post("/auth/logout", logoutUser);
userRouter.post("/auth/refresh", refreshSession);

export default userRouter;
