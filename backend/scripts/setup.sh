#!/bin/bash
# ============================================================================
# CMF Microfinance Platform — Setup Script
# ============================================================================
# Usage: bash scripts/setup.sh
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "========================================="
echo "  CMF Database Setup"
echo "========================================="

# Check if .env exists
if [ ! -f "$PROJECT_DIR/.env" ]; then
    if [ -f "$PROJECT_DIR/.env.example" ]; then
        echo "Creating .env from .env.example..."
        cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
        echo "Please update DATABASE_URL in .env and re-run this script."
        exit 1
    else
        echo "ERROR: No .env or .env.example found. Please set DATABASE_URL."
        exit 1
    fi
fi

echo "Step 1: Running full setup (clean + migrations + base seed)..."
node "$SCRIPT_DIR/setup.js"

echo ""
echo "Step 2: Running Chennai-specific seed data..."
node -e "
const pg = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const DB_URL = process.env.DATABASE_URL;
const client = new pg.Client({ connectionString: DB_URL });
(async () => {
  await client.connect();
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'seed_chennai_data.sql'), 'utf8');
    const stmts = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
    let count = 0;
    for (const stmt of stmts) {
      try { await client.query(stmt); count++; }
      catch (e) { console.error('  Error:', e.message.substring(0, 150)); }
    }
    console.log('Chennai seed: executed ' + count + ' statements.');
  } catch (err) { console.error('Chennai seed failed:', err.message); }
  await client.end();
})();
"

echo ""
echo "Step 3: Verifying seed data..."
node -e "
const pg = require('pg');
const dotenv = require('dotenv');
dotenv.config();

async function verify() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const tables = ['branches','areas','users','user_profiles','loan_products','bank_accounts','ledger_accounts','applications','loans','emi_schedules','emi_payments','penalties','sms_templates','email_templates','notifications','referrals','trust_scores','verification_tasks','npa_classifications','ledger_entries','disbursements','app_settings'];
  for (const t of tables) {
    const r = await client.query('SELECT COUNT(*) as c FROM ' + t);
    console.log('  ' + t + ': ' + r.rows[0].c + ' rows');
  }
  await client.end();
}
verify();
"

echo ""
echo "========================================="
echo "  Setup Complete!"
echo "========================================="
