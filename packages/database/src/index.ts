import dotenv from 'dotenv';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;

// Try loading .env from several locations: current working dir, package, and repo root
const currentDirectory = dirname(fileURLToPath(import.meta.url));
const candidateEnvPaths = [
  join(process.cwd(), '.env'),
  join(currentDirectory, '..', '.env'),
  join(currentDirectory, '..', '..', '.env'),
  join(currentDirectory, '..', '..', '..', '.env'),
];

for (const p of candidateEnvPaths) {
  try {
    const result = dotenv.config({ path: p });
    if (result && result.parsed && !result.error) break;
  } catch (err) {
    // ignore and try next
  }
}


export function createDatabasePool(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }

  return new Pool({ connectionString });
}
