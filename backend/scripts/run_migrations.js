const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DB_CONFIG = {
  host: 'db.kwkdpkewxldxcekeaaoh.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Continnum@2026'
};

// Split SQL by -- ==== section markers, each section is self-contained
function splitBySections(sql) {
  const sections = [];
  let current = '';
  for (let i = 0; i < sql.length; i++) {
    if (sql.substring(i, i - 1) === '--') continue; // skip
    if (sql.substring(i, i + 4) === '\n-- =' || (i === 0 && sql.substring(i, i + 10) === '-- ===')) {
      // Check if this is a major section marker
      const lineEnd = sql.indexOf('\n', i);
      const line = sql.substring(i, lineEnd);
      if (line.includes('MIGRATION') || line.includes('SEED') || line.includes('PART')) {
        if (current.trim().length > 0) {
          sections.push(current.trim());
        }
        current = '';
        continue;
      }
    }
    current += sql[i];
  }
  const last = current.trim();
  if (last.length > 0) sections.push(last);
  return sections;
}

async function runSection(client, section, index) {
  const lines = section.split('\n');
  const stmts = [];
  let current = '';
  let inDollarQuote = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('--')) {
      current += line + '\n';
      continue;
    }
    if (trimmed === '') {
      current += line + '\n';
      continue;
    }

    // Track $$ dollar quotes per line
    let inDQ = inDollarQuote;
    for (let c = 0; c < line.length; c++) {
      if (line[c] === '$') {
        if (c + 1 < line.length && line[c + 1] === '$') {
          inDQ = !inDQ;
          c++;
        }
      }
    }
    inDollarQuote = inDQ;

    if (!inDollarQuote && trimmed.endsWith(';')) {
      current += line + '\n';
      const s = current.trim();
      if (s.length > 2) stmts.push(s);
      current = '';
    } else {
      current += line + '\n';
    }
  }

  const last = current.trim();
  if (last.length > 2 && !last.startsWith('--')) stmts.push(last);

  let ok = 0;
  for (const stmt of stmts) {
    try {
      await client.query(stmt);
      ok++;
    } catch (e) {
      if (e.message.includes('already exists') || e.message.includes('duplicate key')) {
        ok++;
      } else {
        const preview = stmt.substring(0, 60).replace(/\n/g, ' ');
        console.log('  FAIL: ' + preview + ' -> ' + e.message.substring(0, 120));
      }
    }
  }
  console.log('Section ' + (index + 1) + ': ' + ok + ' statements OK');
}

async function run() {
  const client = new Client(DB_CONFIG);
  await client.connect();
  console.log('Connected to database\n');

  const sql = fs.readFileSync('/Users/yogesh/Currently_working/CMF/backend/scripts/migrations.sql', 'utf8');

  // Process line by line, respecting $$ blocks
  const lines = sql.split('\n');
  const sections = [];
  let currentSection = [];
  let inDollarQuote = false;

  for (const line of lines) {
    const trimmed = line.trim();
    // Detect section markers
    if (!inDollarQuote && trimmed.startsWith('--') && trimmed.includes('====')) {
      if (currentSection.length > 0) {
        sections.push(currentSection.join('\n'));
        currentSection = [];
      }
      currentSection.push(line);
      continue;
    }
    // Track dollar quote state
    let dqCount = 0;
    for (let c = 0; c < line.length; c++) {
      if (line[c] === '$' && c + 1 < line.length && line[c + 1] === '$') {
        dqCount++;
        c++;
      }
    }
    if (dqCount % 2 === 1) {
      inDollarQuote = !inDollarQuote;
    }
    currentSection.push(line);
  }
  if (currentSection.length > 0) {
    sections.push(currentSection.join('\n'));
  }

  console.log('Found ' + sections.length + ' sections\n');

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const firstLine = section.split('\n').find(l => l.trim().startsWith('--'));
    const sectionName = firstLine ? firstLine.trim().substring(0, 80) : 'Section ' + (i + 1);
    console.log('Running: ' + sectionName);
    await runSection(client, section, i);
  }

  console.log('\n--- Verification ---');
  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
  console.log('Tables created: ' + res.rows.length);
  res.rows.forEach(t => console.log('  ' + t.table_name));

  const fnRes = await client.query("SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace");
  console.log('\nFunctions: ' + fnRes.rows.length);
  fnRes.rows.forEach(f => console.log('  ' + f.proname));

  await client.end();
}

run().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
