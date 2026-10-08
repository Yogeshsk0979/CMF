#!/usr/bin/env node
/**
 * CMF seed_runner.js
 * Connects to the Supabase PostgreSQL database and executes the seed SQL.
 *
 * Usage:
 *   node scripts/seed_runner.js                         # uses DATABASE_URL env var
 *   node scripts/seed_runner.js --file path/to/seed.sql # custom SQL file
 *   node scripts/seed_runner.js --clean                  # clean DB then seed
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Database connection
// ---------------------------------------------------------------------------
const DATABASE_URL =
    process.env.DATABASE_URL ||
    'postgres://postgres:Continnum@2026@db.kwkdpkewxldxcekeaaoh.supabase.co:5432/postgres';

const DEFAULT_SQL_FILE = path.join(__dirname, 'seed_data.sql');

// ---------------------------------------------------------------------------
// CLI arguments
// ---------------------------------------------------------------------------
const argv = process.argv.slice(2);
let sqlFile = DEFAULT_SQL_FILE;
let shouldClean = false;

for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--file' && i + 1 < argv.length) {
        sqlFile = argv[++i];
    } else if (argv[i] === '--clean') {
        shouldClean = true;
    } else if (argv[i] === '--help' || argv[i] === '-h') {
        console.log(`
CMF Seed Runner
Usage:
  node scripts/seed_runner.js [options]

Options:
  --file <path>   Path to SQL seed file (default: scripts/seed_data.sql)
  --clean         Drop and recreate the id_counters before seeding (use with caution)
  --help, -h      Show this help message
        `);
        process.exit(0);
    }
}

if (!fs.existsSync(sqlFile)) {
    console.error(`ERROR: Seed SQL file not found: ${sqlFile}`);
    process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function log(label, count) {
    if (typeof count === 'number') {
        console.log(`  ${label}: ${count}`);
    } else {
        console.log(`\n--- ${label} ---`);
    }
}

/**
 * Split raw SQL text into individual statements.
 * Handles:
 *   - Standard single-statement semicolons
 *   - Dollar-quoted function bodies ($$ ... $$)
 *   - C-style block comments
 *   - Line comments (-- ...)
 */
function splitStatements(sql) {
    const stmts = [];
    let current = '';
    let inDollarQuote = false;
    let dollarTag = '';
    let inBlockComment = false;
    let i = 0;

    while (i < sql.length) {
        // --- block comment ---
        if (!inDollarQuote && sql.substring(i, i + 2) === '/*') {
            inBlockComment = true;
            i += 2;
            continue;
        }
        if (inBlockComment && sql.substring(i, i + 2) === '*/') {
            inBlockComment = false;
            i += 2;
            continue;
        }
        if (inBlockComment) {
            i++;
            continue;
        }

        // --- dollar quote ---
        if (!inBlockComment && sql[i] === '$') {
            if (!inDollarQuote) {
                // look for $$ or $tag$
                let j = i + 1;
                while (j < sql.length && sql[j] !== '$') j++;
                if (j < sql.length && sql[j] === '$') {
                    inDollarQuote = true;
                    dollarTag = sql.substring(i, j + 1);
                    current += sql.substring(i, j + 1);
                    i = j + 1;
                    continue;
                }
            } else {
                if (sql.substring(i, i + dollarTag.length) === dollarTag) {
                    inDollarQuote = false;
                    current += dollarTag;
                    i += dollarTag.length;
                    continue;
                }
            }
        }

        // --- line comment ---
        if (!inDollarQuote && sql[i] === '-' && i + 1 < sql.length && sql[i + 1] === '-') {
            const eol = sql.indexOf('\n', i);
            if (eol === -1) { i = sql.length; } else { i = eol + 1; }
            continue;
        }

        // --- statement terminator ---
        if (!inDollarQuote && sql[i] === ';') {
            const s = current.trim();
            if (s.length > 2) stmts.push(s);
            current = '';
            i++;
            continue;
        }

        current += sql[i];
        i++;
    }

    // flush remaining
    const remaining = current.trim();
    if (remaining.length > 2 && !inDollarQuote) {
        stmts.push(remaining);
    }
    return stmts;
}

// ---------------------------------------------------------------------------
// Clean helper
// ---------------------------------------------------------------------------
async function cleanDatabase(client) {
    log('Cleaning database');
    const cleanSQL = `
        TRUNCATE TABLE audit_logs, email_logs, sms_logs, trust_scores, referrals,
            verifications, verification_tasks, application_documents, application_notes,
            application_stages, stage_transitions, approval_history, npa_classifications,
            bank_statement_entries, bank_reconciliations,
            ledger_entry_lines, ledger_account_balances, ledger_entries,
            disbursement_charges, penalties, payment_receipts, emi_payments,
            emi_schedules, loans, disbursements,
            application_topics, applications,
            user_permission_overrides, user_areas, password_reset_tokens, jwt_refresh_tokens, login_audit,
            user_profiles, users,
            role_permissions, approval_limits,
            permissions, roles,
            product_slabs, loan_products,
            bank_accounts,
            areas, branches
        CASCADE;
        SELECT 'Cleaned' AS result;
    `;
    const statements = splitStatements(cleanSQL);
    let ok = 0, fail = 0;
    for (const stmt of statements) {
        try {
            await client.query(stmt);
            ok++;
        } catch (e) {
            fail++;
            if (!e.message.includes('does not exist')) {
                console.log(`  [clean skip] ${e.message.substring(0, 80)}`);
            }
        }
    }
    console.log(`  Clean complete: ${ok} statements OK, ${fail} skipped\n`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
    console.log(`\n========================================`);
    console.log(`  CMF Seed Runner`);
    console.log(`  DB: ${DATABASE_URL.replace(/:[^@]*@/, ':***@')}`);
    console.log(`  SQL: ${sqlFile}`);
    console.log(`========================================\n`);

    const client = new Client({ connectionString: DATABASE_URL });

    try {
        await client.connect();
        log('Connected to database');

        if (shouldClean) {
            await cleanDatabase(client);
        }

        log('Reading seed SQL file');
        const sql = fs.readFileSync(sqlFile, 'utf8');
        log('Splitting into statements');
        const statements = splitStatements(sql);
        console.log(`  Total statements: ${statements.length}\n`);

        log('Executing seed statements');
        let ok = 0;
        let skipped = 0;
        let failed = 0;
        const errors = [];

        for (const stmt of statements) {
            try {
                await client.query(stmt);
                ok++;
            } catch (e) {
                // Graceful skip for expected "already exists" / duplicate errors
                if (
                    e.message.includes('already exists') ||
                    e.message.includes('duplicate key') ||
                    e.message.includes('does not exist') && e.message.includes('column')
                ) {
                    skipped++;
                } else {
                    failed++;
                    const preview = stmt.replace(/\n/g, ' ').substring(0, 120);
                    errors.push({ preview, message: e.message });
                }
            }

            // Progress indicator every 50 statements
            if ((ok + skipped + failed) % 50 === 0) {
                console.log(`  ... ${ok + skipped + failed} / ${statements.length} statements processed`);
            }
        }

        console.log(`\n  Summary: ${ok} OK, ${skipped} skipped, ${failed} failed`);

        if (errors.length > 0) {
            console.log('\n  === ERRORS ===');
            errors.slice(0, 20).forEach((e, i) => {
                console.log(`  [${i + 1}] ${e.preview}`);
                console.log(`       ${e.message.substring(0, 200)}`);
            });
            if (errors.length > 20) {
                console.log(`  ... and ${errors.length - 20} more errors`);
            }
        }

        // -------------------------------------------------------------------
        // Verification summary
        // -------------------------------------------------------------------
        log('Seed verification');
        const tables = [
            'branches', 'areas', 'roles', 'permissions', 'role_permissions',
            'users', 'user_profiles', 'user_areas', 'user_permission_overrides',
            'loan_products', 'product_slabs', 'bank_accounts', 'ledger_accounts',
            'customers', 'applications', 'application_topics', 'application_stages',
            'loans', 'emi_schedules', 'disbursements', 'disbursement_charges',
            'emi_payments', 'payment_receipts', 'penalties',
            'ledger_entries', 'ledger_entry_lines', 'bank_statement_entries',
            'bank_reconciliations', 'sms_templates', 'email_templates',
            'approval_limits', 'verification_tasks', 'referrals',
            'trust_scores', 'npa_classifications', 'audit_logs',
            'stage_transitions', 'application_notes', 'application_documents',
            'verifications', 'login_audit'
        ];

        for (const t of tables) {
            try {
                const r = await client.query(`SELECT COUNT(*) AS cnt FROM ${t}`);
                const c = parseInt(r.rows[0].cnt, 10);
                if (c > 0) console.log(`  ${t}: ${c}`);
            } catch (_e) {
                // table might not exist yet
            }
        }

        console.log('\n========================================');
        console.log('  SEEDING COMPLETE');
        console.log('========================================\n');
    } catch (e) {
        console.error(`\nFATAL: ${e.message}`);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
