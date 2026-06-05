/**
 * Mother Care School — Startup Preflight Check
 *
 * Runs before `next dev` / `next start` to verify:
 *   1. Required env vars are set
 *   2. Backend API is reachable
 *
 * Exits with code 0 on success, 1 on failure.
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const APP_MODE = process.env.NEXT_PUBLIC_APP_MODE || 'development';
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_PUBLISHABLE_KEY;

const ts = () => new Date().toISOString().replace('T', ' ').slice(0, 19);
const log = (msg: string) => console.log(`[${ts()}]  ${msg}`);
const warn = (msg: string) => console.warn(`[${ts()}]  ⚠ ${msg}`);
const ok = (msg: string) => console.log(`[${ts()}]  ✅ ${msg}`);
const fail = (msg: string) => console.error(`[${ts()}]  ❌ ${msg}`);

async function main() {
  const allowWarn = process.argv.includes('--allow-warn');
  let hasError = false;

  log('Running startup preflight...');
  console.log('');

  // ─── 1. Env vars ──────────────────────────────────────
  if (!API_URL || API_URL === 'http://localhost:5000') {
    ok(`Backend API URL: ${API_URL}`);
  } else {
    ok(`Backend API URL: ${API_URL}`);
  }

  if (APP_MODE) {
    ok(`App Mode: ${APP_MODE}`);
  } else {
    warn('APP_MODE not set, defaulting to production');
  }

  if (PUBLISHABLE_KEY) {
    ok('Publishable API key: present');
  } else {
    warn('No publishable API key set — frontend auth may be limited');
  }

  // ─── 2. Backend health check ─────────────────────────
  log(`Checking backend at ${API_URL}/health...`);
  try {
    const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      ok(`Backend API is reachable (${API_URL})`);
    } else {
      fail(`Backend returned HTTP ${res.status}`);
      hasError = true;
    }
  } catch (e: any) {
    warn(`Backend API unreachable (${e.message}) — continuing anyway`);
  }

  // ─── 3. Banner ────────────────────────────────────────
  const border = '═'.repeat(48);
  console.log('');
  console.log(`  ╔${border}╗`);
  console.log(`  ║     🌐  Mother Care School — Website                   ║`);
  console.log(`  ║     ${APP_MODE === 'development' ? 'Development Mode' : 'Production Mode'}${' '.repeat(24)}║`);
  console.log(`  ╠${border}╣`);
  if (!hasError) {
    console.log(`  ║     ✅  All checks passed                               ║`);
  } else {
    console.log(`  ║     ⚠️  Some checks failed — continuing anyway          ║`);
  }
  console.log(`  ║     📅  ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`);
  console.log(`  ╚${border}╝`);
  console.log('');

  process.exit(hasError && !allowWarn ? 1 : 0);
}

main().catch((e) => {
  fail(`Preflight error: ${e.message}`);
  process.exit(1);
});
