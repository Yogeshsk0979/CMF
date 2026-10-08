import { chromium } from 'playwright';
import fs from 'fs';

const SCREENSHOT_DIR = '/Users/yogesh/Currently_working/CMF/backend/demo/screenshots';
const BASE_URL = 'http://localhost:5173';

const ROLES = [
  { username: 'admin',          role: 'super_admin',      label: 'Super Admin',     pages: ['Dashboard','Applications','Loans','Disbursements','Ledger','Tasks','Areas','Products','Reports'] },
  { username: 'branch.chennai', role: 'branch_admin',      label: 'Branch Admin',    pages: ['Dashboard','Applications','Loans','Disbursements','Ledger','Tasks','Areas','Products','Reports'] },
  { username: 'tl.anna',        role: 'team_leader',       label: 'Team Leader',     pages: ['Dashboard','Applications','Loans','Disbursements','Ledger','Tasks','Reports'] },
  { username: 'fo.arun',        role: 'field_officer',     label: 'Field Officer',   pages: ['Dashboard','Applications','Loans','Disbursements','Ledger','Tasks'] },
  { username: 'ca.selva',       role: 'collection_agent',  label: 'Collection Agent',pages: ['Dashboard','Applications','Loans','Disbursements','Ledger','Tasks'] },
  { username: 'cust.raman',     role: 'customer',          label: 'Customer',        pages: ['Dashboard','Applications','My Dues','Pay EMI','Receipts'] },
  { username: 'lender.rao',     role: 'lender',            label: 'Lender',          pages: ['Dashboard','Applications','Loans','Disbursements','Ledger','Portfolio'] },
];

const ROUTE_MAP = {
  'Dashboard': '/',
  'Applications': '/applications',
  'Loans': '/loans',
  'Disbursements': '/disbursements',
  'Ledger': '/ledger',
  'Tasks': '/tasks',
  'Areas': '/areas',
  'Products': '/settings',
  'Reports': '/reports',
  'My Dues': '/emi',
  'Pay EMI': '/emi/pay',
  'Receipts': '/emi/receipts',
  'Portfolio': '/reports/portfolio',
};

async function waitForAuth(page, timeout = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const url = page.url();
    if (!url.includes('/login')) return true; // logged in
    // Check if loading spinner is gone
    const spinner = await page.locator('.animate-spin').count();
    if (spinner === 0 && url.includes('/dashboard')) return true;
    await page.waitForTimeout(500);
  }
  return false;
}

async function main() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  console.log('🎬 CMF Screenshot Capture\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'en-IN',
  });

  for (let i = 0; i < ROLES.length; i++) {
    const role = ROLES[i];
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  [${i+1}/${ROLES.length}] ${role.label} — ${role.username}`);
    console.log(`${'═'.repeat(60)}`);

    const page = await context.newPage();

    // Login via UI form
    console.log('  Navigating to login...');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    console.log('  Filling credentials...');
    await page.fill('input[type="text"]', role.username);
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for authentication
    console.log('  Waiting for auth...');
    const authed = await waitForAuth(page, 10000);
    const url = page.url();
    console.log(`  📍 URL: ${url.replace(BASE_URL, '') || '(root)'} — ${authed ? '✅' : '⚠'}`);

    // Extra wait for data to load
    await page.waitForTimeout(3000);

    const fileName = role.label.toLowerCase().replace(/\s+/g, '_');

    for (const pageName of role.pages) {
      const route = ROUTE_MAP[pageName];
      if (!route) continue;

      try {
        await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(3000);
      } catch (e) {
        console.log(`  ⚠ ${pageName}: nav failed`);
      }

      const safeName = pageName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const filePath = `${SCREENSHOT_DIR}/${fileName}_${safeName}.png`;
      await page.screenshot({ path: filePath, fullPage: false });
      console.log(`  📸 ${pageName}`);
    }

    await page.close();

    if (i < ROLES.length - 1) {
      await new Promise(r => setTimeout(r, 10000));
    }
  }

  await browser.close();

  const files = fs.readdirSync(SCREENSHOT_DIR).filter(f => f.endsWith('.png')).sort();
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  📸 Generated ${files.length} screenshots`);
  files.forEach(f => console.log(`     ${f}`));
  console.log(`${'═'.repeat(60)}\n`);
  process.exit(0);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
