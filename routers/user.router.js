import express from "express";

const userRouter = express.Router();

userRouter.post("/auth/register", (_req, res) => {
  res.status(501).json({ message: "Not implemented yet." });
});

export default userRouter;
