import { storage } from './storage';
import { type User, type UpsertUser } from '@shared/schema';
import express from 'express';

export async function handleReplitAuth(userInfo: { id: string; email: string }): Promise<User> {
  try {
    const user: UpsertUser = {
      id: userInfo.id,
      email: userInfo.email,
      referralCode: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await storage.upsertUser(user);
    return result;
  } catch (error) {
    console.error('Error handling Replit auth:', error);
    throw new Error('Failed to authenticate user');
  }
}

export function setupAuth(app: express.Application) {
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    const userId = req.headers['x-replit-user-id'] as string;
    const userEmail = req.headers['x-replit-user-email'] as string;
    if (userId && userEmail) {
      (req as any).user = { id: userId, email: userEmail };
      next();
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  });
}

export function isAuthenticated(req: express.Request, res: express.Response, next: express.NextFunction) {
  if ((req as any).user) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
