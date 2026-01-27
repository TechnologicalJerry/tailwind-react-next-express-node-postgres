import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from './env';
import * as schema from '../db/schema';

const connectionString = env.DATABASE_URL;

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { max: 1 });

export const db = drizzle(client, { schema });

export const closeDatabase = async () => {
  await client.end();
};
