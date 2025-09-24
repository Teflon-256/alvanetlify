import { Client, Issuer } from "openid-client";
import { Strategy } from "passport-openidconnect";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import MemoryStore from "memorystore";
import { storage } from "./storage.js";

if (!process.env.REPLIT_DOMAINS) {
  console.warn("Environment variable REPLIT_DOMAINS not provided, using default domain");
}

const getOidcConfig = memoize(
  async () => {
    try {
      const issuer = await Issuer.discover(process.env.ISSUER_URL ?? "https://replit.com/oidc");
      return {
        client: new Client({
          client_id: process.env.REPL_ID ?? "",
          client_secret: process.env.REPL_SECRET ?? "",
        }, issuer),
      };
    } catch (error) {
      console.error("Error discovering OIDC config:", error);
      throw new Error("Failed to initialize authentication");
    }
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const memoryStore = MemoryStore(session);
  const sessionStore = new memoryStore({
    checkPeriod: sessionTtl,
    ttl: sessionTtl,
  });
  
  return session({
    secret: process.env.SESSION_SECRET || "default-secret",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
      sameSite: "lax",
    },
  });
}

function updateUserSession(
  user: any,
  tokens: { claims: () => any; access_token: string; refresh_token?: string; expires_at?: number }
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = tokens.expires_at;
}

async function upsertUser(claims: any) {
  try {
    await storage.upsertUser({
      id: claims["sub"],
      email: claims["email"],
      firstName: claims["first_name"],
      lastName: claims["last_name"],
      profileImageUrl: claims["profile_image_url"],
    });
  } catch (error) {
    console.error("Error upserting user:", error);
    throw new Error("Failed to upsert user");
  }
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  let config;
  try {
    config = await getOidcConfig();
  } catch (error) {
    console.error("Failed to get OIDC config:", error);
    return;
  }

  const verify = async (
    tokens: any,
    verified: passport.AuthenticateCallback
  ) => {
    try {
      const user = {};
      updateUserSession(user, tokens);
      await upsertUser(tokens.claims());
      verified(null, user);
    } catch (error) {
      verified(error);
    }
  };

  const domain = process.env.REPLIT_DOMAINS?.split(",")[0] || "alvacapital.online";
  const strategy = new Strategy(
    {
      client: config.client,
      params: {
        scope: "openid email profile offline_access",
        redirect_uri: `https://${domain}/api/callback`,
      },
    },
    verify
  );
  passport.use(`replitauth:${domain}`, strategy);

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return next(err);
      }
      try {
        const redirectUrl = config.client.issuer.end_session_endpoint
          ? new URL(config.client.issuer.end_session_endpoint).href + `?client_id=${process.env.REPL_ID || ""}&post_logout_redirect_uri=${req.protocol}://${req.hostname}`
          : "/";
        res.redirect(redirectUrl);
      } catch (error) {
        console.error("Error building logout URL:", error);
        res.redirect("/");
      }
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user?.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await config.client.refresh(refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    console.error("Error refreshing token:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};
