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
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Trading account operations
  getTradingAccounts(userId: string): Promise<TradingAccount[]>;
  createTradingAccount(account: InsertTradingAccount): Promise<TradingAccount>;
  updateTradingAccountBalance(accountId: string, balance: string, dailyPnL: string): Promise<void>;
  deleteTradingAccount(accountId: string, userId: string): Promise<void>;
  
  // Referral operations
  getReferralEarnings(userId: string): Promise<ReferralEarning[]>;
  createReferralEarning(earning: InsertReferralEarning): Promise<ReferralEarning>;
  getTotalReferralEarnings(userId: string): Promise<{ total: string }>;
  getReferralCount(userId: string): Promise<{ count: number }>;
  
  // Master copier operations
  getMasterCopierConnections(userId: string): Promise<MasterCopierConnection[]>;
  createMasterCopierConnection(connection: InsertMasterCopierConnection): Promise<MasterCopierConnection>;
  updateMasterCopierStatus(connectionId: string, isActive: boolean): Promise<void>;
  
  // Referral link operations
  getReferralLinks(userId: string): Promise<ReferralLink[]>;
  createReferralLink(link: InsertReferralLink): Promise<ReferralLink>;
  updateReferralLinkStats(linkId: string, clicks?: number, conversions?: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Generate referral code if not provided
    if (!userData.referralCode) {
      userData.referralCode = this.generateReferralCode();
    }

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

    // Create default referral links for new users
    if (user) {
      await this.createDefaultReferralLinks(user.id);
    }

    return user;
  }

  // Trading account operations
  async getTradingAccounts(userId: string): Promise<TradingAccount[]> {
    return await db
      .select()
      .from(tradingAccounts)
      .where(eq(tradingAccounts.userId, userId))
      .orderBy(desc(tradingAccounts.createdAt));
  }

  async createTradingAccount(account: InsertTradingAccount): Promise<TradingAccount> {
    const [newAccount] = await db
      .insert(tradingAccounts)
      .values(account)
      .returning();
    return newAccount;
  }

  async updateTradingAccountBalance(accountId: string, balance: string, dailyPnL: string): Promise<void> {
    await db
      .update(tradingAccounts)
      .set({ 
        balance, 
        dailyPnL, 
        lastSyncAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(tradingAccounts.id, accountId));
  }

  async deleteTradingAccount(accountId: string, userId: string): Promise<void> {
    await db
      .delete(tradingAccounts)
      .where(and(
        eq(tradingAccounts.id, accountId),
        eq(tradingAccounts.userId, userId)
      ));
  }

  // Referral operations
  async getReferralEarnings(userId: string): Promise<ReferralEarning[]> {
    return await db
      .select()
      .from(referralEarnings)
      .where(eq(referralEarnings.referrerId, userId))
      .orderBy(desc(referralEarnings.createdAt));
  }

  async createReferralEarning(earning: InsertReferralEarning): Promise<ReferralEarning> {
    const [newEarning] = await db
      .insert(referralEarnings)
      .values(earning)
      .returning();
    return newEarning;
  }

  async getTotalReferralEarnings(userId: string): Promise<{ total: string }> {
    const result = await db
      .select({
        total: sql<string>`COALESCE(SUM(${referralEarnings.amount}), 0)::text`
      })
      .from(referralEarnings)
      .where(and(
        eq(referralEarnings.referrerId, userId),
        eq(referralEarnings.status, 'paid')
      ));
    
    return result[0] || { total: '0.00' };
  }

  async getReferralCount(userId: string): Promise<{ count: number }> {
    const result = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${referralEarnings.referredUserId})`
      })
      .from(referralEarnings)
      .where(eq(referralEarnings.referrerId, userId));
    
    return result[0] || { count: 0 };
  }

  // Master copier operations
  async getMasterCopierConnections(userId: string): Promise<MasterCopierConnection[]> {
    return await db
      .select()
      .from(masterCopierConnections)
      .where(eq(masterCopierConnections.userId, userId))
      .orderBy(desc(masterCopierConnections.createdAt));
  }

  async createMasterCopierConnection(connection: InsertMasterCopierConnection): Promise<MasterCopierConnection> {
    const [newConnection] = await db
      .insert(masterCopierConnections)
      .values(connection)
      .returning();
    return newConnection;
  }

  async updateMasterCopierStatus(connectionId: string, isActive: boolean): Promise<void> {
    await db
      .update(masterCopierConnections)
      .set({ 
        isActive, 
        updatedAt: new Date() 
      })
      .where(eq(masterCopierConnections.id, connectionId));
  }

  // Referral link operations
  async getReferralLinks(userId: string): Promise<ReferralLink[]> {
    return await db
      .select()
      .from(referralLinks)
      .where(eq(referralLinks.userId, userId))
      .orderBy(referralLinks.broker);
  }

  async createReferralLink(link: InsertReferralLink): Promise<ReferralLink> {
    const [newLink] = await db
      .insert(referralLinks)
      .values(link)
      .returning();
    return newLink;
  }

  async updateReferralLinkStats(linkId: string, clicks?: number, conversions?: number): Promise<void> {
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
  }

  // Helper methods
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
        referralUrl: `https://partner.bybit.com/b/${this.generateReferralCode().toLowerCase()}`,
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

// Memory storage implementation for when database is unavailable
export class MemoryStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private tradingAccounts: Map<string, TradingAccount[]> = new Map();
  private referralEarnings: Map<string, ReferralEarning[]> = new Map();
  private masterCopierConnections: Map<string, MasterCopierConnection[]> = new Map();
  private referralLinks: Map<string, ReferralLink[]> = new Map();

  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Generate referral code if not provided
    if (!userData.referralCode) {
      userData.referralCode = this.generateReferralCode();
    }

    const existingUser = this.users.get(userData.id);
    const user: User = {
      ...userData,
      createdAt: existingUser?.createdAt || new Date(),
      updatedAt: new Date(),
    } as User;

    this.users.set(userData.id, user);

    // Create default referral links for new users
    if (!existingUser) {
      await this.createDefaultReferralLinks(user.id);
    }

    return user;
  }

  // Trading account operations
  async getTradingAccounts(userId: string): Promise<TradingAccount[]> {
    return this.tradingAccounts.get(userId) || [];
  }

  async createTradingAccount(account: InsertTradingAccount): Promise<TradingAccount> {
    const newAccount: TradingAccount = {
      ...account,
      id: nanoid(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as TradingAccount;

    const userAccounts = this.tradingAccounts.get(account.userId) || [];
    userAccounts.push(newAccount);
    this.tradingAccounts.set(account.userId, userAccounts);

    return newAccount;
  }

  async updateTradingAccountBalance(accountId: string, balance: string, dailyPnL: string): Promise<void> {
    for (const [userId, accounts] of this.tradingAccounts.entries()) {
      const account = accounts.find(acc => acc.id === accountId);
      if (account) {
        account.balance = balance;
        account.dailyPnL = dailyPnL;
        account.lastSyncAt = new Date();
        account.updatedAt = new Date();
        break;
      }
    }
  }

  async deleteTradingAccount(accountId: string, userId: string): Promise<void> {
    const userAccounts = this.tradingAccounts.get(userId) || [];
    const filteredAccounts = userAccounts.filter(acc => acc.id !== accountId);
    this.tradingAccounts.set(userId, filteredAccounts);
  }

  // Referral operations
  async getReferralEarnings(userId: string): Promise<ReferralEarning[]> {
    return this.referralEarnings.get(userId) || [];
  }

  async createReferralEarning(earning: InsertReferralEarning): Promise<ReferralEarning> {
    const newEarning: ReferralEarning = {
      ...earning,
      id: nanoid(),
      createdAt: new Date(),
      paidAt: null,
    } as ReferralEarning;

    const userEarnings = this.referralEarnings.get(earning.referrerId) || [];
    userEarnings.push(newEarning);
    this.referralEarnings.set(earning.referrerId, userEarnings);

    return newEarning;
  }

  async getTotalReferralEarnings(userId: string): Promise<{ total: string }> {
    const earnings = this.referralEarnings.get(userId) || [];
    const total = earnings
      .filter(e => e.status === 'paid')
      .reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0);
    return { total: total.toFixed(2) };
  }

  async getReferralCount(userId: string): Promise<{ count: number }> {
    const earnings = this.referralEarnings.get(userId) || [];
    const uniqueReferrals = new Set(earnings.map(e => e.referredUserId));
    return { count: uniqueReferrals.size };
  }

  // Master copier operations
  async getMasterCopierConnections(userId: string): Promise<MasterCopierConnection[]> {
    return this.masterCopierConnections.get(userId) || [];
  }

  async createMasterCopierConnection(connection: InsertMasterCopierConnection): Promise<MasterCopierConnection> {
    const newConnection: MasterCopierConnection = {
      ...connection,
      id: nanoid(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as MasterCopierConnection;

    const userConnections = this.masterCopierConnections.get(connection.userId) || [];
    userConnections.push(newConnection);
    this.masterCopierConnections.set(connection.userId, userConnections);

    return newConnection;
  }

  async updateMasterCopierStatus(connectionId: string, isActive: boolean): Promise<void> {
    for (const [userId, connections] of this.masterCopierConnections.entries()) {
      const connection = connections.find(conn => conn.id === connectionId);
      if (connection) {
        connection.isActive = isActive;
        connection.updatedAt = new Date();
        break;
      }
    }
  }

  // Referral link operations
  async getReferralLinks(userId: string): Promise<ReferralLink[]> {
    return this.referralLinks.get(userId) || [];
  }

  async createReferralLink(link: InsertReferralLink): Promise<ReferralLink> {
    const newLink: ReferralLink = {
      ...link,
      id: nanoid(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ReferralLink;

    const userLinks = this.referralLinks.get(link.userId) || [];
    userLinks.push(newLink);
    this.referralLinks.set(link.userId, userLinks);

    return newLink;
  }

  async updateReferralLinkStats(linkId: string, clicks?: number, conversions?: number): Promise<void> {
    for (const [userId, links] of this.referralLinks.entries()) {
      const link = links.find(l => l.id === linkId);
      if (link) {
        if (clicks !== undefined) {
          link.clickCount = (link.clickCount || 0) + clicks;
        }
        if (conversions !== undefined) {
          link.conversionCount = (link.conversionCount || 0) + conversions;
        }
        link.updatedAt = new Date();
        break;
      }
    }
  }

  // Helper methods
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
        referralUrl: `https://partner.bybit.com/b/${this.generateReferralCode().toLowerCase()}`,
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

// Use memory storage temporarily until database issue is resolved
export const storage = new MemoryStorage();
