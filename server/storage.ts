import { db } from './db';
import {
  users,
  tradingAccounts,
  referralEarnings,
  masterCopierConnections,
  referralLinks,
  FullInsertUser,
  FullInsertTradingAccount,
  FullInsertReferralLink,
  FullInsertMasterCopierConnection,
} from '../shared/schema';
import { eq } from 'drizzle-orm';

export const storage = {
  getUser: async (id: string) => {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  },

  upsertUser: async (data: FullInsertUser) => {
    await db
      .insert(users)
      .values(data)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...data,
          updatedAt: new Date(),
        },
      });
    const result = await db.select().from(users).where(eq(users.id, data.id));
    return result[0];
  },

  createTradingAccount: async (data: FullInsertTradingAccount) => {
    await db.insert(tradingAccounts).values(data);
    const result = await db
      .select()
      .from(tradingAccounts)
      .where(eq(tradingAccounts.id, data.id));
    return result[0];
  },

  getTradingAccounts: async (userId: string) => {
    return await db
      .select()
      .from(tradingAccounts)
      .where(eq(tradingAccounts.userId, userId));
  },

  deleteTradingAccount: async (accountId: string, userId: string) => {
    await db
      .delete(tradingAccounts)
      .where(
        eq(tradingAccounts.accountId, accountId) &&
        eq(tradingAccounts.userId, userId)
      );
  },

  getReferralEarnings: async (userId: string) => {
    return await db
      .select()
      .from(referralEarnings)
      .where(eq(referralEarnings.referrerId, userId));
  },

  getTotalReferralEarnings: async (userId: string) => {
    const result = await db
      .select()
      .from(referralEarnings)
      .where(eq(referralEarnings.referrerId, userId));
    return result.reduce((sum, row) => sum + parseFloat(row.amount), 0);
  },

  getReferralCount: async (userId: string) => {
    const result = await db
      .select()
      .from(referralEarnings)
      .where(eq(referralEarnings.referrerId, userId));
    return result.length;
  },

  getReferralLinks: async (userId: string) => {
    return await db
      .select()
      .from(referralLinks)
      .where(eq(referralLinks.userId, userId));
  },

  createReferralLink: async (data: FullInsertReferralLink) => {
    await db.insert(referralLinks).values(data);
    const result = await db
      .select()
      .from(referralLinks)
      .where(eq(referralLinks.id, data.id));
    return result[0];
  },

  getMasterCopierConnections: async (userId: string) => {
    return await db
      .select()
      .from(masterCopierConnections)
      .where(eq(masterCopierConnections.userId, userId));
  },

  createMasterCopierConnection: async (data: FullInsertMasterCopierConnection) => {
    await db.insert(masterCopierConnections).values(data);
    const result = await db
      .select()
      .from(masterCopierConnections)
      .where(eq(masterCopierConnections.id, data.id));
    return result[0];
  },

  updateMasterCopierStatus: async (connectionId: string, isActive: boolean) => {
    await db
      .update(masterCopierConnections)
      .set({ isActive: isActive })
      .where(eq(masterCopierConnections.id, connectionId));
  },
