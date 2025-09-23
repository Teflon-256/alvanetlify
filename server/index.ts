import express from "express";
import { router as registerRoutes } from "./routes.js";
import { setupAuth } from "./replitAuth.js";
import serverless from "serverless-http";

const app = express();

app.use(express.json());

(async () => {
  await setupAuth(app);
  registerRoutes(app);
})();

export const handler = serverless(app);
