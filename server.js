import express from "express";
import swaggerUi from "swagger-ui-express";
import { createRequire } from "node:module";
import { appConfig } from "./config/config.js";
import userRouter from "./routers/user.router.js";
import gameRouter from "./routers/game.router.js";

const require = createRequire(import.meta.url);
const swaggerDocument = require("./docs/openapi.json");

const app = express();

app.use(express.json());

app.get("/docs.json", (_req, res) => {
  res.json(swaggerDocument);
});
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/api", userRouter);
app.use("/api", gameRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(appConfig.port, () => {
  console.log(`Server listening on http://localhost:${appConfig.port}`);
});
