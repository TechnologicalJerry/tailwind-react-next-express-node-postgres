import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

// Construct DATABASE_URL from individual environment variables
function encodeURIComponentSafe(str: string): string {
  return encodeURIComponent(str).replace(/%20/g, '+');
}

const dbUsername = process.env.DB_USERNAME || '';
const dbPassword = process.env.DB_PASSWORD || '';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || '5432';
const dbName = process.env.DB_NAME || '';

const databaseUrl = `postgresql://${dbUsername}:${encodeURIComponentSafe(dbPassword)}@${dbHost}:${dbPort}/${dbName}`;

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
});
