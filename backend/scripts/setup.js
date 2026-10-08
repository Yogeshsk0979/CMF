// scripts/run_setup.js — Drop everything and apply fresh migrations + seed data
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_URL = process.env.DATABASE_URL || 'postgres://postgres:Continnum@2026@db.kwkdpkewxldxcekeaaoh.supabase.co:5432/postgres';

const { Client } = pg;

async function executeFile(client, filepath, label) {
  console.log(`\n=== ${label} ===`);
  const sql = fs.readFileSync(filepath, 'utf8');
  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);

  let count = 0;
  for (const statement of statements) {
    try {
      await client.query(statement);
      count++;
    } catch (err) {
      console.error(`  Error in statement ${count + 1}: ${err.message.substring(0, 200)}`);
      throw err;
    }
  }
  console.log(`  Executed ${count} statements.`);
}

async function main() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  console.log('Connected to Supabase PostgreSQL.');

  try {
    // Step 1: Drop everything
    await executeFile(client, path.join(__dirname, 'clean_database.sql'), 'Cleaning database');

    // Step 2: Apply migrations
    await executeFile(client, path.join(__dirname, 'migrations.sql'), 'Applying main migrations');

    // Step 3: Apply patch (additional tables)
    await executeFile(client, path.join(__dirname, 'patch_missing_tables.sql'), 'Applying patches');

    // Step 4: Apply notifications patch
    await executeFile(client, path.join(__dirname, 'patch_notifications.sql'), 'Applying notifications patch');

    // Step 5: Seed base data
    await executeFile(client, path.join(__dirname, 'seed_data.sql'), 'Seeding base data');

    // Step 6: Seed Chennai-specific data
    await executeFile(client, path.join(__dirname, 'seed_chennai_data.sql'), 'Seeding Chennai data');

    console.log('\n=========================================');
    console.log('Setup completed successfully!');
    console.log('=========================================');
  } catch (err) {
    console.error('\nSetup failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();