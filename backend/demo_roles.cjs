// CMF Role Demo - one role at a time with generous delays
const http = require('http');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const BASE = 'http://localhost:3001';
const USERS = [
  { username: 'admin',        role: 'super_admin',      label: 'Super Admin' },
  { username: 'branch.chennai', role: 'branch_admin',   label: 'Branch Admin' },
  { username: 'tl.anna',      role: 'team_leader',      label: 'Team Leader' },
  { username: 'fo.arun',      role: 'field_officer',    label: 'Field Officer' },
  { username: 'ca.selva',     role: 'collection_agent', label: 'Collection Agent' },
  { username: 'cust.raman',   role: 'customer',         label: 'Customer' },
  { username: 'lender.rao',   role: 'lender',           label: 'Lender' },
];

const PAGES = [
  { label: 'Dashboard',            path: '/api/dashboard/stats' },
  { label: 'Applications',         path: '/api/applications?limit=3' },
  { label: 'Loans',                path: '/api/loans?limit=3' },
  { label: 'Collection Overdues',  path: '/api/emi/overdues' },
  { label: 'Disbursements',        path: '/api/disbursements?limit=3' },
  { label: 'Ledger Accounts',      path: '/api/ledger/accounts' },
  { label: 'Ledger Entries',       path: '/api/ledger/entries?limit=3' },
  { label: 'Tasks',                path: '/api/tasks' },
  { label: 'Areas',                path: '/api/areas' },
  { label: 'Loan Products',        path: '/api/settings/products' },
  { label: 'SMS Templates',        path: '/api/communication/sms-templates' },
  { label: 'Email Templates',      path: '/api/communication/email-templates' },
  { label: 'Reports Dashboard',    path: '/api/reports/dashboard' },
  { label: 'Portfolio Report',     path: '/api/reports/portfolio' },
  { label: 'Collection Report',    path: '/api/reports/collection' },
  { label: 'Notifications',        path: '/api/notifications' },
  { label: 'Approval Limits',      path: '/api/dashboard/approval-limits' },
];

function apiCall(method, path, token, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const opts = {
      hostname: url.hostname, port: url.port || 80,
      path: url.pathname + url.search, method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function getToken(username) {
  const res = await apiCall('POST', '/api/auth/login', null, { identifier: username, password: 'password123' });
  if (res.status === 200) return res.data.token;
  return null;
}

function short(obj, mx = 100) {
  if (!obj) return '(empty)';
  if (typeof obj === 'string') return obj.length > mx ? obj.slice(0, mx) + '...' : obj;
  const s = typeof obj === 'object' ? (obj.error ? obj.error : JSON.stringify(obj)) : String(obj);
  return s.length > mx ? s.slice(0, mx) + '...' : s;
}

async function callPage(token, page) {
  const res = await apiCall('GET', page.path, token);
  const s = res.status;
  if (s === 200) {
    const len = Array.isArray(res.data) ? `[${res.data.length}]`
      : res.data.data ? `[${res.data.data.length || res.data.data}]`
      : '';
    return `[200] ${len} ${short(res.data)}`;
  }
  if (s === 401) return '[401] Login required';
  if (s === 403) return '[403] Role not authorized';
  if (s === 404) return '[404] Not found';
  if (s === 429) return '[429] Rate limited';
  return `[${s}] ${short(res.data, 70)}`;
}

async function main() {
  const FAILED = new Set(['admin', 'branch.chennai', 'tl.anna', 'fo.arun', 'ca.selva', 'cust.raman', 'lender.rao']);

  for (const u of USERS) {
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`  ${u.label} (${u.role}) — ${u.username} / password123`);
    console.log(`${'═'.repeat(70)}`);

    // Stagger logins by 8s to avoid rate limit
    if (FAILED.has(u.username)) {
      console.log('  ⏳ Waiting 6s for rate limit cooldown...');
      await sleep(6000);
    }

    const token = await getToken(u.username);
    if (!token) { console.log('  ❌ Login FAILED\n'); FAILED.delete(u.username); continue; }
    console.log('  ✅ Logged in');

    const me = await apiCall('GET', '/api/auth/profile', token);
    if (me.status === 200) {
      const p = me.data?.data || me.data;
      console.log(`  Profile: ${(p?.first_name || '').trim()} ${(p?.last_name || '').trim()}`);
    }

    for (const page of PAGES) {
      const result = await callPage(token, page);
      console.log(`  ${page.label.padEnd(28)} ${result}`);
      await sleep(20);
    }
  }

  console.log(`\n${'═'.repeat(70)}`);
  console.log('  DEMO COMPLETE — 7 roles tested');
  console.log(`${'═'.repeat(70)}\n`);
  process.exit(0);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
