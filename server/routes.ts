import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertTradingAccountSchema, insertReferralEarningSchema, insertMasterCopierConnectionSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard data endpoint
  app.get('/api/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get all dashboard data in parallel
      const [
        tradingAccounts,
        referralEarnings,
        totalEarnings,
        referralCount,
        masterCopierConnections,
        referralLinks
      ] = await Promise.all([
        storage.getTradingAccounts(userId),
        storage.getReferralEarnings(userId),
        storage.getTotalReferralEarnings(userId),
        storage.getReferralCount(userId),
        storage.getMasterCopierConnections(userId),
        storage.getReferralLinks(userId)
      ]);

      // Calculate total portfolio balance
      const totalBalance = tradingAccounts.reduce((sum, account) => {
        return sum + parseFloat(account.balance || '0');
      }, 0);

      // Calculate today's P&L
      const dailyPnL = tradingAccounts.reduce((sum, account) => {
        return sum + parseFloat(account.dailyPnL || '0');
      }, 0);

      res.json({
        totalBalance: totalBalance.toFixed(2),
        dailyPnL: dailyPnL.toFixed(2),
        referralCount: referralCount.count,
        referralEarnings: totalEarnings.total,
        tradingAccounts,
        recentReferralEarnings: referralEarnings.slice(0, 5), // Latest 5 earnings
        masterCopierConnections,
        referralLinks
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Trading account routes
  app.post('/api/trading-accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validation = insertTradingAccountSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request data", error: fromZodError(validation.error).toString() });
      }

      const accountData = { ...validation.data, userId };
      const account = await storage.createTradingAccount(accountData);
      
      res.json(account);
    } catch (error) {
      console.error("Error creating trading account:", error);
      res.status(500).json({ message: "Failed to create trading account" });
    }
  });

  app.delete('/api/trading-accounts/:accountId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { accountId } = req.params;
      
      await storage.deleteTradingAccount(accountId, userId);
      res.json({ message: "Trading account disconnected successfully" });
    } catch (error) {
      console.error("Error deleting trading account:", error);
      res.status(500).json({ message: "Failed to disconnect trading account" });
    }
  });

  // Update account balance (for future API integration)
  app.patch('/api/trading-accounts/:accountId/balance', isAuthenticated, async (req: any, res) => {
    try {
      const { accountId } = req.params;
      const { balance, dailyPnL } = req.body;
      
      if (!balance || !dailyPnL) {
        return res.status(400).json({ message: "Balance and dailyPnL are required" });
      }
      
      await storage.updateTradingAccountBalance(accountId, balance, dailyPnL);
      res.json({ message: "Account balance updated successfully" });
    } catch (error) {
      console.error("Error updating account balance:", error);
      res.status(500).json({ message: "Failed to update account balance" });
    }
  });

  // Master copier routes
  app.post('/api/master-copier/connect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validation = insertMasterCopierConnectionSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request data", error: fromZodError(validation.error).toString() });
      }

      const connectionData = { ...validation.data, userId };
      const connection = await storage.createMasterCopierConnection(connectionData);
      
      res.json(connection);
    } catch (error) {
      console.error("Error connecting to master copier:", error);
      res.status(500).json({ message: "Failed to connect to master copier" });
    }
  });

  app.patch('/api/master-copier/:connectionId/status', isAuthenticated, async (req: any, res) => {
    try {
      const { connectionId } = req.params;
      const { isActive } = req.body;
      
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: "isActive must be a boolean" });
      }
      
      await storage.updateMasterCopierStatus(connectionId, isActive);
      res.json({ message: "Master copier status updated successfully" });
    } catch (error) {
      console.error("Error updating master copier status:", error);
      res.status(500).json({ message: "Failed to update master copier status" });
    }
  });

  // Referral earnings routes
  app.post('/api/referral-earnings', isAuthenticated, async (req: any, res) => {
    try {
      const validation = insertReferralEarningSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request data", error: fromZodError(validation.error).toString() });
      }

      const earning = await storage.createReferralEarning(validation.data);
      res.json(earning);
    } catch (error) {
      console.error("Error creating referral earning:", error);
      res.status(500).json({ message: "Failed to create referral earning" });
    }
  });

  // Referral link tracking
  app.post('/api/referral-links/:linkId/click', async (req, res) => {
    try {
      const { linkId } = req.params;
      await storage.updateReferralLinkStats(linkId, 1);
      res.json({ message: "Click tracked successfully" });
    } catch (error) {
      console.error("Error tracking referral click:", error);
      res.status(500).json({ message: "Failed to track click" });
    }
  });

  // Copy referral link endpoint
  app.get('/api/referral-links/:broker', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { broker } = req.params;
      
      const links = await storage.getReferralLinks(userId);
      const brokerLink = links.find(link => link.broker === broker);
      
      if (!brokerLink) {
        return res.status(404).json({ message: "Referral link not found for this broker" });
      }
      
      res.json(brokerLink);
    } catch (error) {
      console.error("Error fetching referral link:", error);
      res.status(500).json({ message: "Failed to fetch referral link" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
