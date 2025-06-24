import { readFileSync } from 'fs';
import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const {
  PGHOST,
  PGPORT,
  PGUSER,
  PGPASSWORD,
  PGDATABASE
} = process.env;

if (!PGHOST || !PGPORT || !PGUSER || !PGPASSWORD || !PGDATABASE) {
  throw new Error('Missing one or more required database environment variables.');
}

const client = new Client({
  host: PGHOST,
  port: parseInt(PGPORT, 10),
  user: PGUSER,
  password: PGPASSWORD,
  database: PGDATABASE,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runSchema() {
  try {
    const schemaPath = path.join(__dirname, '../src/database/schema.sql');
    const sql = readFileSync(schemaPath, 'utf8');
    await client.connect();
    console.log('Connected to database. Running schema.sql...');
    await client.query(sql);
    console.log('✅ schema.sql executed successfully.');
  } catch (err) {
    console.error('❌ Error running schema.sql:', err);
  } finally {
    await client.end();
  }
}

runSchema(); 