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

async function runInitData() {
  try {
    const dataPath = path.join(__dirname, '../src/database/init-data.sql');
    const sql = readFileSync(dataPath, 'utf8');
    await client.connect();
    console.log('Connected to database. Running init-data.sql...');
    await client.query(sql);
    console.log('✅ init-data.sql executed successfully.');
  } catch (err) {
    console.error('❌ Error running init-data.sql:', err);
  } finally {
    await client.end();
  }
}

runInitData(); 