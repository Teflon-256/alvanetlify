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

export const storage = new DatabaseStorage();
