import express from "express";
import { router } from "./routes.js";
import { setupAuth } from "./replitAuth.js";
import serverless from "serverless-http";

const app = express();

app.use(express.json());

(async () => {
  await setupAuth(app);
  app.use(router); // Use the router directly
})();

export const handler = serverless(app);
