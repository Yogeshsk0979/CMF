const { Client } = require('pg');
const fs = require('fs');

const DB_CONFIG = {
  host: 'db.kwkdpkewxldxcekeaaoh.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Continnum@2026'
};

// Run SQL statements one at a time, splitting on ';' outside string literals
function splitStatements(sql) {
  const stmts = [];
  let cur = '';
  let i = 0;
  let inSingle = false, inDouble = false, inLineComment = false, inBlockComment = false, inDollar = false;
  let dollarTag = '';

  while (i < sql.length) {
    const ch = sql[i];
    const next = i + 1 < sql.length ? sql[i + 1] : '';

    // Handle line comments
    if (inLineComment) {
      if (ch === '\n') inLineComment = false;
      cur += ch;
      i++;
      continue;
    }
    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        cur += '*/';
        i += 2;
        continue;
      }
      cur += ch;
      i++;
      continue;
    }
    if (inSingle) {
      if (ch === "'" && next !== "'") inSingle = false;
      else if (ch === "'" && next === "'") { cur += "''"; i += 2; continue; }
      cur += ch;
      i++;
      continue;
    }
    if (inDouble) {
      if (ch === '"' && next !== '"') inDouble = false;
      cur += ch;
      i++;
      continue;
    }
    if (inDollar) {
      // Check if dollarTag ends here
      const remaining = sql.substring(i);
      if (remaining.startsWith(dollarTag)) {
        cur += dollarTag;
        i += dollarTag.length;
        inDollar = false;
        dollarTag = '';
        continue;
      }
      cur += ch;
      i++;
      continue;
    }

    // Check for entry into comment/string
    if (ch === '-' && next === '-') {
      // Check if it's a line comment (--)
      if (i + 2 < sql.length && sql[i + 2] === ' ') {
        inLineComment = true;
        cur += ch;
        i++;
        continue;
      }
      if (i + 2 < sql.length && sql[i + 2] === '\n') {
        inLineComment = true;
        cur += ch;
        i++;
        continue;
      }
    }
    if (ch === '/' && next === '*') {
      inBlockComment = true;
      cur += ch;
      i++;
      continue;
    }
    if (ch === "'") { inSingle = true; cur += ch; i++; continue; }
    if (ch === '"') { inDouble = true; cur += ch; i++; continue; }
    if (ch === '$') {
      // Read dollar tag
      const match = sql.substring(i).match(/^\$([a-zA-Z_]*)\$/);
      if (match) {
        inDollar = true;
        dollarTag = match[0];
        cur += dollarTag;
        i += dollarTag.length;
        continue;
      }
      // No tag — treat as $$ or single
      if (next === '$') {
        inDollar = true;
        dollarTag = '$$';
        cur += '$$';
        i += 2;
        continue;
      }
    }
    if (ch === ';') {
      const t = cur.trim();
      if (t.length > 0) stmts.push(t);
      cur = '';
      i++;
      continue;
    }
    cur += ch;
    i++;
  }
  const last = cur.trim();
  if (last.length > 0) stmts.push(last);
  return stmts;
}

async function run() {
  const client = new Client(DB_CONFIG);
  await client.connect();
  console.log('Connected\n');

  const sql = fs.readFileSync('/Users/yogesh/Currently_working/CMF/backend/scripts/patch_missing_tables.sql', 'utf8');
  const stmts = splitStatements(sql);

  // Filter out pure-comment statements
  const real = stmts.filter(s => {
    const lines = s.split('\n').filter(l => l.trim().length > 0 && !l.trim().startsWith('--'));
    return lines.length > 0 && !/^(--|$)/.test(s.trim());
  });

  console.log('Statements to run: ' + real.length + '\n');
  let ok = 0, fail = 0;

  for (let i = 0; i < real.length; i++) {
    const s = real[i].replace(/\n/g, ' ').replace(/\s+/g, ' ');
    const preview = s.substring(0, 80);
    try {
      await client.query(real[i]);
      ok++;
    } catch (e) {
      fail++;
      console.log('FAIL [' + (i + 1) + ']: ' + preview);
      console.log('  ' + e.message.substring(0, 150));
    }
  }

  console.log('\nResult: ' + ok + ' OK, ' + fail + ' failed');

  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
  console.log('\nTotal tables: ' + res.rows.length);
  res.rows.forEach(t => console.log('  ' + t.table_name));

  await client.end();
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });