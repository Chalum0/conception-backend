import express from "express";
import { listGames, createGame } from "../controllers/game.controller.js";
import {
  authenticateAccessToken,
  requireAdmin,
} from "../middlewares/auth.middleware.js";

const gameRouter = express.Router();

gameRouter.get("/games", listGames);
gameRouter.post(
  "/games",
  authenticateAccessToken,
  requireAdmin,
  createGame,
);

export default gameRouter;
