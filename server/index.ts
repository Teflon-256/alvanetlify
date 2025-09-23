import express from "express";
import registerRoutes from "./routes";
import { setupAuth } from "./replitAuth";
import serverless from "serverless-http";

const app = express();

app.use(express.json());

(async () => {
  await setupAuth(app);
  registerRoutes(app);
})();

export const handler = serverless(app);
