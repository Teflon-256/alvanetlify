import { Router, Request, Response } from "express";
import { z } from "zod";
import { storage } from "./storage.js";
import { isAuthenticated } from "./replitAuth.js";
import {
  type User,
  type TradingAccount,
  type ReferralEarning,
  type MasterCopierConnection,
  type ReferralLink,
  type InsertTradingAccount,
  type InsertReferralEarning,
  type InsertMasterCopierConnection,
  type InsertReferralLink,
} from "@shared/schema";
import { nanoid } from "nanoid";

export const router = Router();

// User routes
router.get("/user", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: No user ID found" });
    }
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/user", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userData = req.body;
    userData.id = (req.user as any)?.claims?.sub;
    if (!userData.id) {
      return res.status(401).json({ message: "Unauthorized: No user ID found" });
    }
    const user = await storage.upsertUser(userData);
    res.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Trading account routes
router.get("/trading-accounts", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: No user ID found" });
    }
    const accounts = await storage.getTradingAccounts(userId);
    
    // Calculate aggregated metrics
    const totalBalance = accounts.reduce((sum: number, account: TradingAccount) => sum + parseFloat(account.balance || "0"), 0).toFixed(2);
    const totalDailyPnL = accounts.reduce((sum: number, account: TradingAccount) => sum + parseFloat(account.dailyPnL || "0"), 0).toFixed(2);
    
    res.json({
      accounts,
      metrics: {
        totalBalance,
        totalDailyPnL,
        accountCount: accounts.length,
      },
    });
  } catch (error) {
    console.error("Error fetching trading accounts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/trading-accounts", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: No user ID found" });
    }
    const accountData: InsertTradingAccount = {
      ...req.body,
      id: nanoid(),
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const account = await storage.createTradingAccount(accountData);
    res.status(201).json(account);
  } catch (error) {
    console.error("Error creating trading account:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/trading-accounts/:id", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: No user ID found" });
    }
    const { id } = req.params;
    const { balance, dailyPnL } = req.body;
    await storage.updateTradingAccountBalance(id, balance, dailyPnL);
    res.json({ message: "Account updated successfully" });
  } catch (error) {
    console.error("Error updating trading account:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/trading-accounts/:id", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: No user ID found" });
    }
    const { id } = req.params;
    await storage.deleteTradingAccount(id, userId);
    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting trading account:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Referral earnings routes
router.get("/referral-earnings", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: No user ID found" });
    }
    const earnings = await storage.getReferralEarnings(userId);
    const totalEarnings = await storage.getTotalReferralEarnings(userId);
    const referralCount = await storage.getReferralCount(userId);
    
    res.json({
      earnings,
      metrics: {
        totalEarnings: totalEarnings.total,
        referralCount: referralCount.count,
      },
    });
  } catch (error) {
    console.error("Error fetching referral earnings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/referral-earnings", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: No user ID found" });
    }
    const earningData: InsertReferralEarning = {
      ...req.body,
      id: nanoid(),
      referrerId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const earning = await storage.createReferralEarning(earningData);
    res.status(201).json(earning);
  } catch (error) {
    console.error("Error creating referral earning:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Master copier connections routes
router.get("/master-copier-connections", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: No user ID found" });
    }
    const connections = await storage.getMasterCopierConnections(userId);
    res.json(connections);
  } catch (error) {
    console.error("Error fetching master copier connections:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/master-copier-connections", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: No user ID found" });
    }
    const connectionData: InsertMasterCopierConnection = {
      ...req.body,
      id: nanoid(),
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const connection = await storage.createMasterCopierConnection(connectionData);
    res.status(201).json(connection);
  } catch (error) {
    console.error("Error creating master copier connection:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/master-copier-connections/:id", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: No user ID found" });
    }
    const { id } = req.params;
    const { isActive } = req.body;
    await storage.updateMasterCopierStatus(id, isActive);
    res.json({ message: "Connection status updated successfully" });
  } catch (error) {
    console.error("Error updating master copier connection:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Referral links routes
router.get("/referral-links", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: No user ID found" });
    }
    const links = await storage.getReferralLinks(userId);
    res.json(links);
  } catch (error) {
    console.error("Error fetching referral links:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/referral-links", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: No user ID found" });
    }
    const linkData: InsertReferralLink = {
      ...req.body,
      id: nanoid(),
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const link = await storage.createReferralLink(linkData);
    res.status(201).json(link);
  } catch (error) {
    console.error("Error creating referral link:", error);
