import express from "express";
import { listGames } from "../controllers/game.controller.js";

const gameRouter = express.Router();

gameRouter.get("/games", listGames);

export default gameRouter;
