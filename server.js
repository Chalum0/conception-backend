import express from "express";
import { appConfig } from "./config/config.js";
import userRouter from "./routers/user.router.js";
import gameRouter from "./routers/game.router.js";

const app = express();

app.use(express.json());

app.use("/api", userRouter);
app.use("/api", gameRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(appConfig.port, () => {
  console.log(`Server listening on http://localhost:${appConfig.port}`);
});
