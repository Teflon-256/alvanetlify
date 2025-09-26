var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  insertMasterCopierConnectionSchema: () => insertMasterCopierConnectionSchema,
  insertReferralEarningSchema: () => insertReferralEarningSchema,
  insertReferralLinkSchema: () => insertReferralLinkSchema,
  insertTradingAccountSchema: () => insertTradingAccountSchema,
  insertUserSchema: () => insertUserSchema,
  masterCopierConnections: () => masterCopierConnections,
  masterCopierConnectionsRelations: () => masterCopierConnectionsRelations,
  referralEarnings: () => referralEarnings,
  referralEarningsRelations: () => referralEarningsRelations,
  referralLinks: () => referralLinks,
  referralLinksRelations: () => referralLinksRelations,
  sessions: () => sessions,
  tradingAccounts: () => tradingAccounts,
  tradingAccountsRelations: () => tradingAccountsRelations,
  users: () => users,
  usersRelations: () => usersRelations
});
import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  referralCode: varchar("referral_code").unique(),
  referredBy: varchar("referred_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var tradingAccounts = pgTable("trading_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  broker: varchar("broker").notNull(),
  // 'exness', 'bybit', 'binance'
  accountId: varchar("account_id").notNull(),
  accountName: varchar("account_name"),
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0.00"),
  dailyPnL: decimal("daily_pnl", { precision: 15, scale: 2 }).default("0.00"),
  copyStatus: varchar("copy_status").default("inactive"),
  // 'active', 'inactive', 'paused'
  isConnected: boolean("is_connected").default(true),
  apiKeyEncrypted: text("api_key_encrypted"),
  // Encrypted API credentials
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var referralEarnings = pgTable("referral_earnings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: varchar("referrer_id").notNull().references(() => users.id),
  referredUserId: varchar("referred_user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  feePercentage: decimal("fee_percentage", { precision: 5, scale: 2 }).default("10.00"),
  // 10% of 50% fees
  broker: varchar("broker").notNull(),
  transactionType: varchar("transaction_type").notNull(),
  // 'commission', 'trading_fee', etc.
  status: varchar("status").default("pending"),
  // 'pending', 'paid', 'cancelled'
  createdAt: timestamp("created_at").defaultNow(),
  paidAt: timestamp("paid_at")
});
var masterCopierConnections = pgTable("master_copier_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  tradingAccountId: varchar("trading_account_id").notNull().references(() => tradingAccounts.id),
  masterAccountId: varchar("master_account_id").notNull(),
  copyRatio: decimal("copy_ratio", { precision: 5, scale: 2 }).default("1.00"),
  // 1.00 = 100%
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var referralLinks = pgTable("referral_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  broker: varchar("broker").notNull(),
  // 'exness', 'bybit', 'binance'
  referralUrl: text("referral_url").notNull(),
  clickCount: integer("click_count").default(0),
  conversionCount: integer("conversion_count").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var usersRelations = relations(users, ({ many, one }) => ({
  tradingAccounts: many(tradingAccounts),
  referralEarnings: many(referralEarnings, { relationName: "referrerEarnings" }),
  referredEarnings: many(referralEarnings, { relationName: "referredEarnings" }),
  masterCopierConnections: many(masterCopierConnections),
  referralLinks: many(referralLinks),
  referrer: one(users, {
    fields: [users.referredBy],
    references: [users.id]
  })
}));
var tradingAccountsRelations = relations(tradingAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [tradingAccounts.userId],
    references: [users.id]
  }),
  masterCopierConnections: many(masterCopierConnections)
}));
var referralEarningsRelations = relations(referralEarnings, ({ one }) => ({
  referrer: one(users, {
    fields: [referralEarnings.referrerId],
    references: [users.id],
    relationName: "referrerEarnings"
  }),
  referredUser: one(users, {
    fields: [referralEarnings.referredUserId],
    references: [users.id],
    relationName: "referredEarnings"
  })
}));
var masterCopierConnectionsRelations = relations(masterCopierConnections, ({ one }) => ({
  user: one(users, {
    fields: [masterCopierConnections.userId],
    references: [users.id]
  }),
  tradingAccount: one(tradingAccounts, {
    fields: [masterCopierConnections.tradingAccountId],
    references: [tradingAccounts.id]
  })
}));
var referralLinksRelations = relations(referralLinks, ({ one }) => ({
  user: one(users, {
    fields: [referralLinks.userId],
    references: [users.id]
  })
}));
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertTradingAccountSchema = createInsertSchema(tradingAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertReferralEarningSchema = createInsertSchema(referralEarnings).omit({
  id: true,
  createdAt: true,
  paidAt: true
});
var insertMasterCopierConnectionSchema = createInsertSchema(masterCopierConnections).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertReferralLinkSchema = createInsertSchema(referralLinks).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, and, sql as sql2, desc } from "drizzle-orm";
import { randomBytes } from "crypto";
import { nanoid } from "nanoid";
var MemoryStorage = class {
  users = /* @__PURE__ */ new Map();
  tradingAccounts = /* @__PURE__ */ new Map();
  referralEarnings = /* @__PURE__ */ new Map();
  masterCopierConnections = /* @__PURE__ */ new Map();
  referralLinks = /* @__PURE__ */ new Map();
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id) {
    return this.users.get(id);
  }
  async upsertUser(userData) {
    if (!userData.referralCode) {
      userData.referralCode = this.generateReferralCode();
    }
    const existingUser = this.users.get(userData.id);
    const user = {
      ...userData,
      createdAt: existingUser?.createdAt || /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.users.set(userData.id, user);
    if (!existingUser) {
      await this.createDefaultReferralLinks(user.id);
    }
    return user;
  }
  // Trading account operations
  async getTradingAccounts(userId) {
    return this.tradingAccounts.get(userId) || [];
  }
  async createTradingAccount(account) {
    const newAccount = {
      ...account,
      id: nanoid(),
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    const userAccounts = this.tradingAccounts.get(account.userId) || [];
    userAccounts.push(newAccount);
    this.tradingAccounts.set(account.userId, userAccounts);
    return newAccount;
  }
  async updateTradingAccountBalance(accountId, balance, dailyPnL) {
    for (const [userId, accounts] of this.tradingAccounts.entries()) {
      const account = accounts.find((acc) => acc.id === accountId);
      if (account) {
        account.balance = balance;
        account.dailyPnL = dailyPnL;
        account.lastSyncAt = /* @__PURE__ */ new Date();
        account.updatedAt = /* @__PURE__ */ new Date();
        break;
      }
    }
  }
  async deleteTradingAccount(accountId, userId) {
    const userAccounts = this.tradingAccounts.get(userId) || [];
    const filteredAccounts = userAccounts.filter((acc) => acc.id !== accountId);
    this.tradingAccounts.set(userId, filteredAccounts);
  }
  // Referral operations
  async getReferralEarnings(userId) {
    return this.referralEarnings.get(userId) || [];
  }
  async createReferralEarning(earning) {
    const newEarning = {
      ...earning,
      id: nanoid(),
      createdAt: /* @__PURE__ */ new Date(),
      paidAt: null
    };
    const userEarnings = this.referralEarnings.get(earning.referrerId) || [];
    userEarnings.push(newEarning);
    this.referralEarnings.set(earning.referrerId, userEarnings);
    return newEarning;
  }
  async getTotalReferralEarnings(userId) {
    const earnings = this.referralEarnings.get(userId) || [];
    const total = earnings.filter((e) => e.status === "paid").reduce((sum, e) => sum + parseFloat(e.amount || "0"), 0);
    return { total: total.toFixed(2) };
  }
  async getReferralCount(userId) {
    const earnings = this.referralEarnings.get(userId) || [];
    const uniqueReferrals = new Set(earnings.map((e) => e.referredUserId));
    return { count: uniqueReferrals.size };
  }
  // Master copier operations
  async getMasterCopierConnections(userId) {
    return this.masterCopierConnections.get(userId) || [];
  }
  async createMasterCopierConnection(connection) {
    const newConnection = {
      ...connection,
      id: nanoid(),
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    const userConnections = this.masterCopierConnections.get(connection.userId) || [];
    userConnections.push(newConnection);
    this.masterCopierConnections.set(connection.userId, userConnections);
    return newConnection;
  }
  async updateMasterCopierStatus(connectionId, isActive) {
    for (const [userId, connections] of this.masterCopierConnections.entries()) {
      const connection = connections.find((conn) => conn.id === connectionId);
      if (connection) {
        connection.isActive = isActive;
        connection.updatedAt = /* @__PURE__ */ new Date();
        break;
      }
    }
  }
  // Referral link operations
  async getReferralLinks(userId) {
    return this.referralLinks.get(userId) || [];
  }
  async createReferralLink(link) {
    const newLink = {
      ...link,
      id: nanoid(),
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    const userLinks = this.referralLinks.get(link.userId) || [];
    userLinks.push(newLink);
    this.referralLinks.set(link.userId, userLinks);
    return newLink;
  }
  async updateReferralLinkStats(linkId, clicks, conversions) {
    for (const [userId, links] of this.referralLinks.entries()) {
      const link = links.find((l) => l.id === linkId);
      if (link) {
        if (clicks !== void 0) {
          link.clickCount = (link.clickCount || 0) + clicks;
        }
        if (conversions !== void 0) {
          link.conversionCount = (link.conversionCount || 0) + conversions;
        }
        link.updatedAt = /* @__PURE__ */ new Date();
        break;
      }
    }
  }
  // Helper methods
  generateReferralCode() {
    return randomBytes(4).toString("hex").toUpperCase();
  }
  async createDefaultReferralLinks(userId) {
    const domain = process.env.REPLIT_DOMAINS?.split(",")[0] || "alvacapital.online";
    const defaultLinks = [
      {
        userId,
        broker: "exness",
        referralUrl: `https://one.exness.link/a/${this.generateReferralCode().toLowerCase()}`
      },
      {
        userId,
        broker: "bybit",
        referralUrl: "https://partner.bybit.com/b/119776"
      },
      {
        userId,
        broker: "binance",
        referralUrl: `https://accounts.binance.com/register?ref=${this.generateReferralCode()}`
      }
    ];
    for (const link of defaultLinks) {
      try {
        await this.createReferralLink(link);
      } catch (error) {
        console.error(`Failed to create referral link for ${link.broker}:`, error);
      }
    }
  }
};
var storage = new MemoryStorage();

// server/replitAuth.ts
import * as client from "openid-client";
import { Strategy } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import memoize from "memoizee";
import MemoryStore from "memorystore";
if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}
var getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID
    );
  },
  { maxAge: 3600 * 1e3 }
);
function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const memoryStore = MemoryStore(session);
  const sessionStore = new memoryStore({
    checkPeriod: sessionTtl,
    ttl: sessionTtl
  });
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl
    }
  });
}
function updateUserSession(user, tokens) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}
async function upsertUser(claims) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"]
  });
}
async function setupAuth(app2) {
  app2.set("trust proxy", 1);
  app2.use(getSession());
  app2.use(passport.initialize());
  app2.use(passport.session());
  const config = await getOidcConfig();
  const verify = async (tokens, verified) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };
  for (const domain of process.env.REPLIT_DOMAINS.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`
      },
      verify
    );
    passport.use(strategy);
  }
  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((user, cb) => cb(null, user));
  app2.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"]
    })(req, res, next);
  });
  app2.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login"
    })(req, res, next);
  });
  app2.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`
        }).href
      );
    });
  });
}
var isAuthenticated = async (req, res, next) => {
  const user = req.user;
  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const now = Math.floor(Date.now() / 1e3);
  if (now <= user.expires_at) {
    return next();
  }
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

// server/routes.ts
import { fromZodError } from "zod-validation-error";
async function registerRoutes(app2) {
  await setupAuth(app2);
  app2.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.get("/api/dashboard", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const [
        tradingAccounts2,
        referralEarnings2,
        totalEarnings,
        referralCount,
        masterCopierConnections2,
        referralLinks2
      ] = await Promise.all([
        storage.getTradingAccounts(userId),
        storage.getReferralEarnings(userId),
        storage.getTotalReferralEarnings(userId),
        storage.getReferralCount(userId),
        storage.getMasterCopierConnections(userId),
        storage.getReferralLinks(userId)
      ]);
      const totalBalance = tradingAccounts2.reduce((sum, account) => {
        return sum + parseFloat(account.balance || "0");
      }, 0);
      const dailyPnL = tradingAccounts2.reduce((sum, account) => {
        return sum + parseFloat(account.dailyPnL || "0");
      }, 0);
      res.json({
        totalBalance: totalBalance.toFixed(2),
        dailyPnL: dailyPnL.toFixed(2),
        referralCount: referralCount.count,
        referralEarnings: totalEarnings.total,
        tradingAccounts: tradingAccounts2,
        recentReferralEarnings: referralEarnings2.slice(0, 5),
        // Latest 5 earnings
        masterCopierConnections: masterCopierConnections2,
        referralLinks: referralLinks2
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });
  app2.post("/api/trading-accounts", isAuthenticated, async (req, res) => {
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
  app2.delete("/api/trading-accounts/:accountId", isAuthenticated, async (req, res) => {
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
  app2.patch("/api/trading-accounts/:accountId/balance", isAuthenticated, async (req, res) => {
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
  app2.post("/api/master-copier/connect", isAuthenticated, async (req, res) => {
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
  app2.patch("/api/master-copier/:connectionId/status", isAuthenticated, async (req, res) => {
    try {
      const { connectionId } = req.params;
      const { isActive } = req.body;
      if (typeof isActive !== "boolean") {
        return res.status(400).json({ message: "isActive must be a boolean" });
      }
      await storage.updateMasterCopierStatus(connectionId, isActive);
      res.json({ message: "Master copier status updated successfully" });
    } catch (error) {
      console.error("Error updating master copier status:", error);
      res.status(500).json({ message: "Failed to update master copier status" });
    }
  });
  app2.post("/api/referral-earnings", isAuthenticated, async (req, res) => {
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
  app2.post("/api/referral-links/:linkId/click", async (req, res) => {
    try {
      const { linkId } = req.params;
      await storage.updateReferralLinkStats(linkId, 1);
      res.json({ message: "Click tracked successfully" });
    } catch (error) {
      console.error("Error tracking referral click:", error);
      res.status(500).json({ message: "Failed to track click" });
    }
  });
  app2.get("/api/referral-links/:broker", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { broker } = req.params;
      const links = await storage.getReferralLinks(userId);
      const brokerLink = links.find((link) => link.broker === broker);
      if (!brokerLink) {
        return res.status(404).json({ message: "Referral link not found for this broker" });
      }
      res.json(brokerLink);
    } catch (error) {
      console.error("Error fetching referral link:", error);
      res.status(500).json({ message: "Failed to fetch referral link" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid as nanoid2 } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid2()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
