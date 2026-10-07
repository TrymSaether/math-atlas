/**
 * Math Atlas smoke driver
 * Usage: node .claude/skills/run-math-atlas/driver.mjs
 * Env:   BASE_URL (default http://localhost:5173/math-atlas/)
 *        SHOTS_DIR (default /tmp/math-atlas-shots)
 */
import { createRequire } from 'module';
import { mkdir } from 'fs/promises';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

// Resolve playwright from the project root's node_modules
const projectRoot = resolve(fileURLToPath(import.meta.url), '../../../..');
const require = createRequire(join(projectRoot, 'package.json'));
const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173/math-atlas/';
const SHOTS_DIR = process.env.SHOTS_DIR ?? '/tmp/math-atlas-shots';

await mkdir(SHOTS_DIR, { recursive: true });

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await (await browser.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));

// 1. Initial load — full graph overview
await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
await page.screenshot({ path: join(SHOTS_DIR, '01-initial.png') });
console.log('01-initial.png — full graph overview');

// 2. Click a concept node to open the side panel
try {
  await page.waitForSelector('.react-flow__node-topo', { timeout: 10000 });
  await page.locator('.react-flow__node-topo').first().click({ force: true });
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(SHOTS_DIR, '02-node-selected.png') });
  console.log('02-node-selected.png — node panel open');
} catch (e) {
  console.warn('node click skipped:', e.message);
}

if (errors.length) console.error('Page errors:', errors);
await browser.close();
console.log('Screenshots saved to', SHOTS_DIR);
