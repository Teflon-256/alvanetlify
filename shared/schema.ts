import { pgTable, text, timestamp, numeric, boolean, serial } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  profileImageUrl: text('profile_image_url'),
  referralCode: text('referral_code').notNull().unique(),
  referredBy: text('referred_by'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const tradingAccounts = pgTable('trading_accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  broker: text('broker').notNull(),
  accountId: text('account_id').notNull(),
  accountName: text('account_name'),
  balance: text('balance'),
  dailyPnL: text('daily_pnl'),
  copyStatus: text('copy_status'),
  isConnected: boolean('is_connected'),
  apiKeyEncrypted: text('api_key_encrypted'),
  lastSyncAt: timestamp('last_sync_at'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const referralEarnings = pgTable('referral_earnings', {
  id: text('id').primaryKey(),
  referrerId: text('referrer_id').notNull().references(() => users.id),
  referredUserId: text('referred_user_id').notNull().references(() => users.id),
  amount: text('amount').notNull(),
  feePercentage: text('fee_percentage'),
  broker: text('broker').notNull(),
  transactionType: text('transaction_type').notNull(),
  status: text('status'),
  createdAt: timestamp('created_at').notNull(),
  paidAt: timestamp('paid_at'),
});

export const masterCopierConnections = pgTable('master_copier_connections', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  tradingAccountId: text('trading_account_id').notNull().references(() => tradingAccounts.id),
  masterAccountId: text('master_account_id').notNull(),
  copyRatio: text('copy_ratio'),
  isActive: boolean('is_active'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});
export type FullInsertUser = {
  id: string;
  email: string;
  referralCode: string;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  referredBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type FullInsertTradingAccount = {
  id: string;
  userId: string;
  broker: string;
  accountId: string;
  accountName?: string | null;
  balance?: string | null;
  dailyPnL?: string | null;
  copyStatus?: string | null;
  isConnected?: boolean | null;
  apiKeyEncrypted?: string | null;
  lastSyncAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type FullInsertReferralLink = {
  id: string;
  userId: string;
  broker: string;
  referralUrl: string;
  clickCount: number;
  conversionCount: number;
  isActive?: boolean | null;
  createdAt: Date;
  updatedAt: Date;
};

export type FullInsertMasterCopierConnection = {
  id: string;
  userId: string;
  tradingAccountId: string;
  masterAccountId: string;
  copyRatio?: string | null;
  isActive?: boolean | null;
  createdAt: Date;
  updatedAt: Date;
};


export const referralLinks = pgTable('referral_links', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  broker: text('broker').notNull(),
  referralUrl: text('referral_url').notNull(),
  clickCount: serial('click_count').notNull().default(0),
  conversionCount: serial('conversion_count').notNull().default(0),
  isActive: boolean('is_active'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type TradingAccount = typeof tradingAccounts.$inferSelect;
export type InsertTradingAccount = typeof tradingAccounts.$inferInsert;
export type ReferralEarning = typeof referralEarnings.$inferSelect;
export type InsertReferralEarning = typeof referralEarnings.$inferInsert;
export type MasterCopierConnection = typeof masterCopierConnections.$inferSelect;
export type InsertMasterCopierConnection = typeof masterCopierConnections.$inferInsert;
export type ReferralLink = typeof referralLinks.$inferSelect;
export type InsertReferralLink = typeof referralLinks.$inferInsert;
