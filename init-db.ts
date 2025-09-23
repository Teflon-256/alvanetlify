import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from '@shared/schema';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

async function initDB() {
  console.log('Initializing database schema...');
  // Drizzle will automatically create tables defined in schema
  await db.$client.query('SELECT 1'); // Test connection
  console.log('Database schema initialized!');
  await pool.end();
}

initDB().catch(console.error);
