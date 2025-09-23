import {
  users,
  tradingAccounts,
  referralEarnings,
  masterCopierConnections,
  referralLinks,
  type User,
  type UpsertUser,
  type TradingAccount,
  type InsertTradingAccount,
  type ReferralEarning,
  type InsertReferralEarning,
  type MasterCopierConnection,
  type InsertMasterCopierConnection,
  type ReferralLink,
  type InsertReferralLink,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc } from "drizzle-orm";
import { randomBytes } from "crypto";
import { nanoid } from "nanoid";

// Interface for storage operations
export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getTradingAccounts(userId: string): Promise<TradingAccount[]>;
  createTradingAccount(account: InsertTradingAccount): Promise<TradingAccount>;
  updateTradingAccountBalance(accountId: string, balance: string, dailyPnL: string): Promise<void>;
  deleteTradingAccount(accountId: string, userId: string): Promise<void>;
  getReferralEarnings(userId: string): Promise<ReferralEarning[]>;
  createReferralEarning(earning: InsertReferralEarning): Promise<ReferralEarning>;
  getTotalReferralEarnings(userId: string): Promise<{ total: string }>;
  getReferralCount(userId: string): Promise<{ count: number }>;
  getMasterCopierConnections(userId: string): Promise<MasterCopierConnection[]>;
  createMasterCopierConnection(connection: InsertMasterCopierConnection): Promise<MasterCopierConnection>;
  updateMasterCopierStatus(connectionId: string, isActive: boolean): Promise<void>;
  getReferralLinks(userId: string): Promise<ReferralLink[]>;
  createReferralLink(link: InsertReferralLink): Promise<ReferralLink>;
  updateReferralLinkStats(linkId: string, clicks?: number, conversions?: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error("Error fetching user:", error);
      return undefined;
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (!userData.referralCode) {
      userData.referralCode = this.generateReferralCode();
    }

    try {
      const [user] = await db
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            ...userData,
            updatedAt: new Date(),
          },
        })
        .returning();

      if (user) {
        await this.createDefaultReferralLinks(user.id);
      }

      return user;
    } catch (error) {
      console.error("Error upserting user:", error);
      throw new Error("Failed to upsert user");
    }
  }

  async getTradingAccounts(userId: string): Promise<TradingAccount[]> {
    try {
      return await db
        .select()
        .from(tradingAccounts)
        .where(eq(tradingAccounts.userId, userId))
        .orderBy(desc(tradingAccounts.createdAt));
    } catch (error) {
      console.error("Error fetching trading accounts:", error);
      return [];
    }
  }

  async createTradingAccount(account: InsertTradingAccount): Promise<TradingAccount> {
    try {
      const [newAccount] = await db
        .insert(tradingAccounts)
        .values(account)
        .returning();
      return newAccount;
    } catch (error) {
      console.error("Error creating trading account:", error);
      throw new Error("Failed to create trading account");
    }
  }

  async updateTradingAccountBalance(accountId: string, balance: string, dailyPnL: string): Promise<void> {
    try {
      await db
        .update(tradingAccounts)
        .set({ 
          balance, 
          dailyPnL, 
          lastSyncAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(tradingAccounts.id, accountId));
    } catch (error) {
      console.error("Error updating trading account balance:", error);
      throw new Error("Failed to update trading account balance");
    }
  }

  async deleteTradingAccount(accountId: string, userId: string): Promise<void> {
    try {
      await db
        .delete(tradingAccounts)
        .where(and(
          eq(tradingAccounts.id, accountId),
          eq(tradingAccounts.userId, userId)
        ));
    } catch (error) {
      console.error("Error deleting trading account:", error);
      throw new Error("Failed to delete trading account");
    }
  }

  async getReferralEarnings(userId: string): Promise<ReferralEarning[]> {
    try {
      return await db
        .select()
        .from(referralEarnings)
        .where(eq(referralEarnings.referrerId, userId))
        .orderBy(desc(referralEarnings.createdAt));
    } catch (error) {
      console.error("Error fetching referral earnings:", error);
      return [];
    }
  }

  async createReferralEarning(earning: InsertReferralEarning): Promise<ReferralEarning> {
    try {
      const [newEarning] = await db
        .insert(referralEarnings)
        .values(earning)
        .returning();
      return newEarning;
    } catch (error) {
      console.error("Error creating referral earning:", error);
      throw new Error("Failed to create referral earning");
    }
  }

  async getTotalReferralEarnings(userId: string): Promise<{ total: string }> {
    try {
      const result = await db
        .select({
          total: sql`COALESCE(SUM(${referralEarnings.amount}), 0)::text`
        })
        .from(referralEarnings)
        .where(and(
          eq(referralEarnings.referrerId, userId),
          eq(referralEarnings.status, 'paid')
        ));
      
      return result[0] || { total: '0.00' };
    } catch (error) {
      console.error("Error fetching total referral earnings:", error);
      return { total: '0.00' };
    }
  }

  async getReferralCount(userId: string): Promise<{ count: number }> {
    try {
      const result = await db
        .select({
          count: sql<number>`COUNT(DISTINCT ${referralEarnings.referredUserId})`
        })
        .from(referralEarnings)
        .where(eq(referralEarnings.referrerId, userId));
      
      return result[0] || { count: 0 };
    } catch (error) {
      console.error("Error fetching referral count:", error);
      return { count: 0 };
    }
  }

  async getMasterCopierConnections(userId: string): Promise<MasterCopierConnection[]> {
    try {
      return await db
        .select()
        .from(masterCopierConnections)
        .where(eq(masterCopierConnections.userId, userId))
        .orderBy(desc(masterCopierConnections.createdAt));
    } catch (error) {
      console.error("Error fetching master copier connections:", error);
      return [];
    }
  }

  async createMasterCopierConnection(connection: InsertMasterCopierConnection): Promise<MasterCopierConnection> {
    try {
      const [newConnection] = await db
        .insert(masterCopierConnections)
        .values(connection)
        .returning();
      return newConnection;
    } catch (error) {
      console.error("Error creating master copier connection:", error);
      throw new Error("Failed to create master copier connection");
    }
  }

  async updateMasterCopierStatus(connectionId: string, isActive: boolean): Promise<void> {
    try {
      await db
        .update(masterCopierConnections)
        .set({ 
          isActive, 
          updatedAt: new Date() 
        })
        .where(eq(masterCopierConnections.id, connectionId));
    } catch (error) {
      console.error("Error updating master copier status:", error);
      throw new Error("Failed to update master copier status");
    }
  }

  async getReferralLinks(userId: string): Promise<ReferralLink[]> {
    try {
      return await db
        .select()
        .from(referralLinks)
        .where(eq(referralLinks.userId, userId))
        .orderBy(referralLinks.broker);
    } catch (error) {
      console.error("Error fetching referral links:", error);
      return [];
    }
  }

  async createReferralLink(link: InsertReferralLink): Promise<ReferralLink> {
    try {
      const [newLink] = await db
        .insert(referralLinks)
        .values(link)
        .returning();
      return newLink;
    } catch (error) {
      console.error("Error creating referral link:", error);
      throw new Error("Failed to create referral link");
    }
  }

  async updateReferralLinkStats(linkId: string, clicks?: number, conversions?: number): Promise<void> {
    try {
      const updateData: any = { updatedAt: new Date() };
      
      if (clicks !== undefined) {
        updateData.clickCount = sql`${referralLinks.clickCount} + ${clicks}`;
      }
      
      if (conversions !== undefined) {
        updateData.conversionCount = sql`${referralLinks.conversionCount} + ${conversions}`;
      }

      await db
        .update(referralLinks)
        .set(updateData)
        .where(eq(referralLinks.id, linkId));
    } catch (error) {
      console.error("Error updating referral link stats:", error);
      throw new Error("Failed to update referral link stats");
    }
  }

  private generateReferralCode(): string {
    return randomBytes(4).toString('hex').toUpperCase();
  }

  private async createDefaultReferralLinks(userId: string): Promise<void> {
    const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || 'alvacapital.online';
    
    const defaultLinks = [
      {
        userId,
        broker: 'exness',
        referralUrl: `https://one.exness.link/a/${this.generateReferralCode().toLowerCase()}`,
      },
      {
        userId,
        broker: 'bybit',
        referralUrl: 'https://partner.bybit.com/b/119776',
      },
      {
        userId,
        broker: 'binance',
        referralUrl: `https://accounts.binance.com/register?ref=${this.generateReferralCode()}`,
      },
    ];

    for (const link of defaultLinks) {
      try {
        await this.createReferralLink(link);
      } catch (error) {
        console.error(`Failed to create referral link for ${link.broker}:`, error);
      }
    }
  }
}

export class MemoryStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private tradingAccounts: Map<string, TradingAccount> = new Map();
  private referralEarnings: Map<string, ReferralEarning> = new Map();
  private masterCopierConnections: Map<string, MasterCopierConnection> = new Map();
  private referralLinks: Map<string, ReferralLink> = new Map();

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (!userData.referralCode) {
      userData.referralCode = randomBytes(4).toString('hex').toUpperCase();
    }
    const user: User = { ...userData, createdAt: new Date(), updatedAt: new Date() };
    this.users.set(user.id, user);
    await this.createDefaultReferralLinks(user.id);
    return user;
  }

  async getTradingAccounts(userId: string): Promise<TradingAccount[]> {
    return Array.from(this.tradingAccounts.values()).filter(acc => acc.userId === userId);
  }

  async createTradingAccount(account: InsertTradingAccount): Promise<TradingAccount> {
    const newAccount: TradingAccount = { ...account, id: nanoid(), createdAt: new Date(), updatedAt: new Date() };
    this.tradingAccounts.set(newAccount.id, newAccount);
    return newAccount;
  }

  async updateTradingAccountBalance(accountId: string, balance: string, dailyPnL: string): Promise<void> {
    const account = this.tradingAccounts.get(accountId);
    if (account) {
      account.balance = balance;
      account.dailyPnL = dailyPnL;
      account.lastSyncAt = new Date();
      account.updatedAt = new Date();
    }
  }

  async deleteTradingAccount(accountId: string, userId: string): Promise<void> {
    const account = this.tradingAccounts.get(accountId);
    if (account && account.userId === userId) {
      this.tradingAccounts.delete(accountId);
    }
  }

  async getReferralEarnings(userId: string): Promise<ReferralEarning[]> {
    return Array.from(this.referralEarnings.values()).filter(earning => earning.referrerId === userId);
  }

  async createReferralEarning(earning: InsertReferralEarning): Promise<ReferralEarning> {
    const newEarning: ReferralEarning = { ...earning, id: nanoid(), createdAt: new Date(), updatedAt: new Date() };
    this.referralEarnings.set(newEarning.id, newEarning);
    return newEarning;
  }

  async getTotalReferralEarnings(userId: string): Promise<{ total: string }> {
    const earnings = Array.from(this.referralEarnings.values())
      .filter(e => e.referrerId === userId && e.status === 'paid');
    const total = earnings.reduce((sum, e) => sum + parseFloat(e.amount), 0).toFixed(2);
    return { total };
  }

  async getReferralCount(userId: string): Promise<{ count: number }> {
    const referredUserIds = new Set(
      Array.from(this.referralEarnings.values())
        .filter(e => e.referrerId === userId)
        .map(e => e.referredUserId)
    );
    return { count: referredUserIds.size };
  }

  async getMasterCopierConnections(userId: string): Promise<MasterCopierConnection[]> {
    return Array.from(this.masterCopierConnections.values()).filter(conn => conn.userId === userId);
  }

  async createMasterCopierConnection(connection: InsertMasterCopierConnection): Promise<MasterCopierConnection> {
    const newConnection: MasterCopierConnection = { ...connection, id: nanoid(), createdAt: new Date(), updatedAt: new Date() };
    this.masterCopierConnections.set(newConnection.id, newConnection);
    return newConnection;
  }

  async updateMasterCopierStatus(connectionId: string, isActive: boolean): Promise<void> {
    const connection = this.masterCopierConnections.get(connectionId);
    if (connection) {
      connection.isActive = isActive;
      connection.updatedAt = new Date();
    }
  }

  async getReferralLinks(userId: string): Promise<ReferralLink[]> {
    return Array.from(this.referralLinks.values()).filter(link => link.userId === userId);
  }

  async createReferralLink(link: InsertReferralLink): Promise<ReferralLink> {
    const newLink: ReferralLink = { ...link, id: nanoid(), createdAt: new Date(), updatedAt: new Date(), clickCount: 0, conversionCount: 0 };
    this.referralLinks.set(newLink.id, newLink);
    return newLink;
  }

  async updateReferralLinkStats(linkId: string, clicks?: number, conversions?: number): Promise<void> {
    const link = this.referralLinks.get(linkId);
    if (link) {
      if (clicks !== undefined) link.clickCount = (link.clickCount || 0) + clicks;
      if (conversions !== undefined) link.conversionCount = (link.conversionCount || 0) + conversions;
      link.updatedAt = new Date();
    }
  }

  private async createDefaultReferralLinks(userId: string): Promise<void> {
    const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || 'alvacapital.online';
    const defaultLinks = [
      { userId, broker: 'exness', referralUrl: `https://one.exness.link/a/${randomBytes(4).toString('hex').toLowerCase()}` },
      { userId, broker: 'bybit', referralUrl: 'https://partner.bybit.com/b/119776' },
      { userId, broker: 'binance', referralUrl: `https://accounts.binance.com/register?ref=${randomBytes(4).toString('hex').toUpperCase()}` },
    ];

    for (const link of defaultLinks) {
      await this.createReferralLink(link);
    }
  }
}

// Use database storage in production, memory storage as fallback
export const storage = process.env.NODE_ENV === 'production' ? new DatabaseStorage() : new MemoryStorage();
