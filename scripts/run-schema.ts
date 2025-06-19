import { readFileSync } from 'fs';
import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const {
  SUPABASE_DB_HOST,
  SUPABASE_DB_PORT,
  SUPABASE_DB_USER,
  SUPABASE_DB_PASSWORD,
  SUPABASE_DB_NAME
} = process.env;

if (!SUPABASE_DB_HOST || !SUPABASE_DB_PORT || !SUPABASE_DB_USER || !SUPABASE_DB_PASSWORD || !SUPABASE_DB_NAME) {
  throw new Error('Missing one or more required database environment variables.');
}

const client = new Client({
  host: SUPABASE_DB_HOST,
  port: parseInt(SUPABASE_DB_PORT, 10),
  user: SUPABASE_DB_USER,
  password: SUPABASE_DB_PASSWORD,
  database: SUPABASE_DB_NAME,
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