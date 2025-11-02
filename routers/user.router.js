import express from "express";
import {
  registerUser,
  loginUser,
} from "../controllers/user.controller.js";

const userRouter = express.Router();

userRouter.post("/auth/register", registerUser);
userRouter.post("/auth/login", loginUser);

export default userRouter;
