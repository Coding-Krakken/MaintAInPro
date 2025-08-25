import dotenv from 'dotenv';
// Load environment variables from .env.local and .env
dotenv.config({ path: '.env.local' });
dotenv.config();

import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from '../shared/schema';

// Check if DATABASE_URL is set for production PostgreSQL usage
// TODO: Import correct Database type from actual DB library or define locally if needed
let db: any = null; // TODO: Replace 'any' with actual database type

if (!process.env.DATABASE_URL) {
  console.log('DATABASE_URL not set - using in-memory storage for development');
  // For development mode, we'll use in-memory storage in storage.ts
  db = null;
} else {
  console.log('Initializing database connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL);

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  db = drizzle(pool, { schema });

  console.log('Database connection initialized successfully');
}

export { db };
export type Database = typeof db;
// ...existing code...
