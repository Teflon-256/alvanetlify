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
import { db } from "./db.js";
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
      const result = await db.select().from(users).where(eq(users.id, id));
      return result[0];
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
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl,
            referralCode: userData.referralCode,
            referredBy: userData.referredBy,
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
      const result = await db
        .select()
        .from(tradingAccounts)
        .where(eq(tradingAccounts.userId, userId))
        .orderBy(desc(tradingAccounts.createdAt));
      return result;
    } catch (error) {
      console.error("Error fetching trading accounts:", error);
      return [];
    }
  }

  async createTradingAccount(account: InsertTradingAccount): Promise<TradingAccount> {
    try {
      const [newAccount] = await db
        .insert(tradingAccounts)
        .values({
          ...account,
          id: account.id,
          userId: account.userId,
          broker: account.broker,
          accountId: account.accountId,
          accountName: account.accountName ?? null,
          balance: account.balance ?? null,
          dailyPnL: account.dailyPnL ?? null,
          copyStatus: account.copyStatus ?? null,
          isConnected: account.isConnected ?? null,
          apiKeyEncrypted: account.apiKeyEncrypted ?? null,
          lastSyncAt: account.lastSyncAt ?? null,
          createdAt: account.createdAt ?? new Date(),
          updatedAt: account.updatedAt ?? new Date(),
        })
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
          updatedAt: new Date(),
        })
        .where(eq(tradingAccounts.id, accountId));
    } catch (error) {
      console.error("Error updating trading account balance:", error);
      throw new Error("Failed to update
