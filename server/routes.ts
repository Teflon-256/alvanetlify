import express from 'express';
import { storage } from './storage';
import { handleReplitAuth, isAuthenticated } from './replitAuth';
import { randomBytes } from 'crypto';
import {
  InsertTradingAccount,
  InsertReferralLink,
  InsertMasterCopierConnection,
} from '../shared/schema';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
    }
  }
}

const router = express.Router();

router.get('/api/auth/replit', async (req, res) => {
  try {
    const userInfo = {
      id: req.query.id as string,
      email: req.query.email as string,
    };
    if (!userInfo.id || !userInfo.email) {
      return res.status(400).json({ error: 'Missing user info' });
    }
    const user = await handleReplitAuth(userInfo);
    res.json(user);
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

router.get('/api/user', isAuthenticated, async (req, res) => {
  try {
    const user = await storage.getUser(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.get('/api/trading-accounts', isAuthenticated, async (req, res) => {
  try {
    const accounts = await storage.getTradingAccounts(req.user!.id);
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching trading accounts:', error);
    res.status(500).json({ error: 'Failed to fetch trading accounts' });
  }
});

router.post('/api/trading-accounts', isAuthenticated, async (req, res) => {
  try {
    const { broker, accountId, accountName, balance, dailyPnL, copyStatus, isConnected, apiKeyEncrypted } = req.body;
    const account: InsertTradingAccount = {
      id: randomBytes(16).toString('hex'),
      userId: req.user!.id,
      broker,
      accountId,
      accountName,
      balance,
      dailyPnL,
      copyStatus,
      isConnected,
      apiKeyEncrypted,
      lastSyncAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await storage.createTradingAccount(account);
    res.json(result);
  } catch (error) {
    console.error('Error creating trading account:', error);
    res.status(500).json({ error: 'Failed to create trading account' });
  }
});

router.delete('/api/trading-accounts/:accountId', isAuthenticated, async (req, res) => {
  try {
    await storage.deleteTradingAccount(req.params.accountId, req.user!.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting trading account:', error);
    res.status(500).json({ error: 'Failed to delete trading account' });
  }
});

router.get('/api/referral-earnings', isAuthenticated, async (req, res) => {
  try {
    const earnings = await storage.getReferralEarnings(req.user!.id);
    res.json(earnings);
  } catch (error) {
    console.error('Error fetching referral earnings:', error);
    res.status(500).json({ error: 'Failed to fetch referral earnings' });
  }
});

router.get('/api/referral-links', isAuthenticated, async (req, res) => {
  try {
    const links = await storage.getReferralLinks(req.user!.id);
    res.json(links);
  } catch (error) {
    console.error('Error fetching referral links:', error);
    res.status(500).json({ error: 'Failed to fetch referral links' });
  }
});

router.post('/api/referral-links', isAuthenticated, async (req, res) => {
  try {
    const { broker, referralUrl } = req.body;
    const link: InsertReferralLink = {
      id: randomBytes(16).toString('hex'),
      userId: req.user!.id,
      broker,
      referralUrl,
      clickCount: 0,
      conversionCount: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await storage.createReferralLink(link);
    res.json(result);
  } catch (error) {
    console.error('Error creating referral link:', error);
    res.status(500).json({ error: 'Failed to create referral link' });
  }
});

router.get('/api/referral-stats', isAuthenticated, async (req, res) => {
  try {
    const [totalEarnings, referralCount] = await Promise.all([
      storage.getTotalReferralEarnings(req.user!.id),
      storage.getReferralCount(req.user!.id),
    ]);
    res.json({ totalEarnings, referralCount });
  } catch (error) {
    console.error('Error fetching referral stats:', error);
    res.status(500).json({ error: 'Failed to fetch referral stats' });
  }
});

router.get('/api/master-copier-connections', isAuthenticated, async (req, res) => {
  try {
    const connections = await storage.getMasterCopierConnections(req.user!.id);
    res.json(connections);
  } catch (error) {
    console.error('Error fetching master copier connections:', error);
    res.status(500).json({ error: 'Failed to fetch master copier connections' });
  }
});

router.post('/api/master-copier-connections', isAuthenticated, async (req, res) => {
  try {
    const { tradingAccountId, masterAccountId, copyRatio, isActive } = req.body;
    const connection: InsertMasterCopierConnection = {
      id: randomBytes(16).toString('hex'),
      userId: req.user!.id,
      tradingAccountId,
      masterAccountId,
      copyRatio,
      isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await storage.createMasterCopierConnection(connection);
    res.json(result);
  } catch (error) {
    console.error('Error creating master copier connection:', error);
    res.status(500).json({ error: 'Failed to create master copier connection' });
  }
});

router.patch('/api/master-copier-connections/:connectionId', isAuthenticated, async (req, res) => {
  try {
    const { isActive } = req.body;
    await storage.updateMasterCopierStatus(req.params.connectionId, isActive);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating master copier connection:', error);
    res.status(500).json({ error: 'Failed to update master copier connection' });
  }
});

export default router;
