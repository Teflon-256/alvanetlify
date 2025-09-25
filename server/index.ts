import express from 'express';
import router from './routes';
import { setupAuth } from './replitAuth';
import serverless from 'serverless-http';

const app = express();

setupAuth(app);
app.use(express.json());
app.use(router);

export const handler = serverless(app);
export default app;
