import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from "@shared/schema";

if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set, falling back to memory storage");
}

let db: any;
if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema });
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }
}

export { db };
