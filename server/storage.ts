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

// Interface for storage operations
export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getTradingAccounts(userId: string): Promise<TradingAccount[]>;
  createTradingAccount(account: InsertTradingAccount & { id: string; createdAt: Date; updatedAt: Date }): Promise<TradingAccount>;
  updateTradingAccountBalance(accountId: string, balance: string, dailyPnL: string): Promise<void>;
  deleteTradingAccount(accountId: string, userId: string): Promise<void>;
  getReferralEarnings(userId: string): Promise<ReferralEarning[]>;
  createReferralEarning(earning: InsertReferralEarning & { id: string; createdAt: Date }): Promise<ReferralEarning>;
  getTotalReferralEarnings(userId: string): Promise<{ total: string }>;
  getReferralCount(userId: string): Promise<{ count: number }>;
  getMasterCopierConnections(userId: string): Promise<MasterCopierConnection[]>;
  createMasterCopierConnection(connection: InsertMasterCopierConnection & { id: string; createdAt: Date; updatedAt: Date }): Promise<MasterCopierConnection>;
  updateMasterCopierStatus(connectionId: string, isActive: boolean): Promise<void>;
  getReferralLinks(userId: string): Promise<ReferralLink[]>;
  createReferralLink(link: InsertReferralLink & { id: string; createdAt: Date; updatedAt: Date }): Promise<ReferralLink>;
  updateReferralLinkStats(linkId: string, clicks?: number, conversions?: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id));
      return result[0] as User | undefined;
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
      const result = await db
        .insert(users)
        .values({
          ...userData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
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

      const user = result[0] as User;

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
      return result as TradingAccount[];
    } catch (error) {
      console.error("Error fetching trading accounts:", error);
      return [];
    }
  }

  async createTradingAccount(account: InsertTradingAccount & { id: string; createdAt: Date; updatedAt: Date }): Promise<TradingAccount> {
    try {
      const [newAccount] = await db
        .insert(tradingAccounts)
        .values({
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
          createdAt: account.createdAt,
          updatedAt: account.updatedAt,
        })
        .returning();
      return newAccount as TradingAccount;
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
      const result = await db
        .select()
        .from(referralEarnings)
        .where(eq(referralEarnings.referrerId, userId))
        .orderBy(desc(referralEarnings.createdAt));
      return result as ReferralEarning[];
    } catch (error) {
      console.error("Error fetching referral earnings:", error);
      return [];
    }
  }

  async createReferralEarning(earning: InsertReferralEarning & { id: string; createdAt: Date }): Promise<ReferralEarning> {
    try {
      const [newEarning] = await db
        .insert(referralEarnings)
        .values({
          id: earning.id,
          referrerId: earning.referrerId,
          referredUserId: earning.referredUserId,
          amount: earning.amount,
          feePercentage: earning.feePercentage ?? null,
          broker: earning.broker,
          transactionType: earning.transactionType,
          status: earning.status ?? null,
          createdAt: earning.createdAt,
          paidAt: null,
        })
        .returning();
      return newEarning as ReferralEarning;
    } catch (error) {
      console.error("Error creating referral earning:", error);
      throw new Error("Failed to create referral earning");
    }
  }

  async getTotalReferralEarnings(userId: string): Promise<{ total: string }> {
    try {
      const result = await db
        .select({
          total: sql<string>`COALESCE(SUM(${referralEarnings.amount}), '0.00')::text`
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
      const result = await db
        .select()
        .from(masterCopierConnections)
        .where(eq(masterCopierConnections.userId, userId))
        .orderBy(desc(masterCopierConnections.createdAt));
      return result as MasterCopierConnection[];
    } catch (error) {
      console.error("Error fetching master copier connections:", error);
      return [];
    }
  }

  async createMasterCopierConnection(connection: InsertMasterCopierConnection & { id: string; createdAt: Date; updatedAt: Date }): Promise<MasterCopierConnection> {
    try {
      const [newConnection] = await db
        .insert(masterCopierConnections)
        .values({
          id: connection.id,
          userId: connection.userId,
          tradingAccountId: connection.tradingAccountId,
          masterAccountId: connection.masterAccountId,
          copyRatio: connection.copyRatio ?? null,
          isActive: connection.isActive ?? null,
          createdAt: connection.createdAt,
          updatedAt: connection.updatedAt,
        })
        .returning();
      return newConnection as MasterCopierConnection;
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
          updatedAt: new Date(),
        })
        .where(eq(masterCopierConnections.id, connectionId));
    } catch (error) {
      console.error("Error updating master copier status:", error);
      throw new Error("Failed to update master copier status");
    }
  }

  async getReferralLinks(userId: string): Promise<ReferralLink[]> {
    try {
      const result = await db
        .select()
        .from(referralLinks)
        .where(eq(referralLinks.userId, userId))
        .orderBy(referralLinks.broker);
      return result as ReferralLink[];
    } catch (error) {
      console.error("Error fetching referral links:", error);
      return [];
    }
  }

  async createReferralLink(link: InsertReferralLink & { id: string; createdAt: Date; updatedAt: Date }): Promise<ReferralLink> {
    try {
      const [newLink] = await db
        .insert(referralLinks)
        .values({
          id: link.id,
          userId: link.userId,
          broker: link.broker,
          referralUrl: link.referralUrl,
          clickCount: link.clickCount ?? 0,
          conversionCount: link.conversionCount ?? 0,
          isActive: link.isActive ?? null,
          createdAt: link.createdAt,
          updatedAt: link.updatedAt,
        })
        .returning();
      return newLink as ReferralLink;
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
    
    const defaultLinks: (InsertReferralLink & { createdAt: Date; updatedAt: Date })[] = [
      {
        userId,
        broker: 'exness',
        referralUrl: `https://one.exness.link/a/${this.generateReferralCode().toLowerCase()}`,
        clickCount: 0,
        conversionCount: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId,
        broker: 'bybit',
        referralUrl: 'https://partner.bybit.com/b/119776',
        clickCount: 0,
        conversionCount: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId,
        broker: 'binance',
        referralUrl: `https://accounts.binance.com/register?ref=${this.generateReferralCode()}`,
        clickCount: 0,
        conversionCount: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
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
    const user: User = { ...userData, id: userData.id, createdAt: new Date(), updatedAt: new Date() };
    this.users.set(user.id, user);
    await this.createDefaultReferralLinks(user.id);
    return user;
  }

  async getTradingAccounts(userId: string): Promise<TradingAccount[]> {
    return Array.from(this.tradingAccounts.values()).filter(acc => acc.userId === userId);
  }

  async createTradingAccount(account: InsertTradingAccount & { id: string; createdAt: Date; updatedAt: Date }): Promise<TradingAccount> {
    const newAccount: TradingAccount = { 
      ...account, 
      accountName: account.accountName ?? null,
      balance: account.balance ?? null,
      dailyPnL: account.dailyPnL ?? null,
      copyStatus: account.copyStatus ?? null,
      isConnected: account.isConnected ?? null,
      apiKeyEncrypted: account.apiKeyEncrypted ?? null,
      lastSyncAt: account.lastSyncAt ?? null,
    };
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

  async createReferralEarning(earning: InsertReferralEarning & { id: string; createdAt: Date }): Promise<ReferralEarning> {
    const newEarning: ReferralEarning = { 
      ...earning, 
      feePercentage: earning.feePercentage ?? null,
      status: earning.status ?? null,
      paidAt: null,
    };
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

  async createMasterCopierConnection(connection: InsertMasterCopierConnection & { id: string; createdAt: Date; updatedAt: Date }): Promise<MasterCopierConnection> {
    const newConnection: MasterCopierConnection = { 
      ...connection, 
      copyRatio: connection.copyRatio ?? null,
      isActive: connection.isActive ?? null,
    };
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

  async createReferralLink(link: InsertReferralLink & { id: string; createdAt: Date; updatedAt: Date }): Promise<ReferralLink> {
    const newLink: ReferralLink = { 
      ...link, 
      clickCount: link.clickCount ?? 0, 
      conversionCount: link.conversionCount ?? 0,
      isActive: link.isActive ?? null,
    };
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
    const defaultLinks: (InsertReferralLink & { id: string; createdAt: Date; updatedAt: Date })[] = [
      { 
        id: randomBytes(16).toString('hex'),
        userId, 
        broker: 'exness', 
        referralUrl: `https://one.exness.link/a/${randomBytes(4).toString('hex').toLowerCase()}`, 
        clickCount: 0, 
        conversionCount: 0, 
        isActive: true, 
        createdAt: new Date(), 
        updatedAt: new Date(),
      },
      { 
        id: randomBytes(16).toString('hex'),
        userId, 
        broker: 'bybit', 
        referralUrl: 'https://partner.bybit.com/b/119776', 
        clickCount: 0, 
        conversionCount: 0, 
        isActive: true, 
        simplified code to avoid TypeScript errors caused by the database's UUID generator.

### Instructions (Like You’re 5)
The toy builder (`tsc`) got upset because:
1. Some toy boxes (`id` fields in `createDefaultReferralLinks`) were labeled as strings, but the database wanted special UUID labels.
2. A toy sorter (query in `upsertUser`) was confused about how to sort toys due to Neon’s special rules.
We fixed `storage.ts` by letting the database make its own special IDs for referral links and teaching the sorter how to handle Neon’s toys. Save the file, commit with the message:
- `server/storage.ts`: `Let database handle referral link IDs and fix upsertUser typing`
Push to GitHub, redeploy on Netlify, and check the build log. Visit your site (e.g., `https://your-site.netlify.app`) if it works! 😊

### Additional Notes
- **Line number consistency**: Errors (55, 59, 418) match previous logs, pointing to `upsertUser` and `createDefaultReferralLinks`.
- **package.json**: No changes needed; the log shows 6 packages added, 1 removed, 2 changed, consistent with prior builds.
- **schema.ts**: Still correct, as no schema-related errors appear.
- **Environment variables**: Ensure `REPL_ID`, `REPL_SECRET`, `REPLIT_DOMAINS`, `SESSION_SECRET`, and `DATABASE_URL` are set in Netlify’s environment variables (Site Settings > Environment Variables).
- **Browserslist warning**: Run `npx update-browserslist-db@latest` locally and commit `package-lock.json` changes, though this isn’t critical.
- **If the build fails**: Share the new log. Potential issues could include `tsconfig.server.json` misconfiguration, schema mismatches, or runtime errors (e.g., missing environment variables).

If you need help with the next build log or further issues, share them!
