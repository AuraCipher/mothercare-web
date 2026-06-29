/**
 * Mother Care School — Startup Preflight Check
 *
 * Runs before `next dev` / `next start` to verify:
 *   1. Publishable key (pk_mcs_*) — frontend app identification
 *   2. Secret key (sk_mcs_*) — server-side admin calls
 *   3. Both keys use branch-encoded format
 *   4. Backend API is reachable
 *   5. Both keys are valid against backend
 *
 * Exits with code 0 on success, 1 on failure — server NEVER starts if keys are missing.
 */

import dotenv from 'dotenv';
import config from '../src/config';
dotenv.config({ path: '.env.local' });
const APP_MODE = process.env.NEXT_PUBLIC_APP_MODE || 'development';
const PUB_KEY = process.env.NEXT_PUBLIC_PUBLISHABLE_KEY;
const SEC_KEY = process.env.SECRET_KEY;

const ts = () => new Date().toISOString().replace('T', ' ').slice(0, 19);
const log = (msg: string) => console.log(`[${ts()}]  ${msg}`);
const ok = (msg: string) => console.log(`[${ts()}]  ✅ ${msg}`);
const fail = (msg: string) => { console.error(`[${ts()}]  ❌ ${msg}`); hasError = true; };

let hasError = false;

async function main() {
  log('Running startup preflight...');
  console.log('');

  // ─── 1. Publishable API key — REQUIRED ───────────────────
  if (!PUB_KEY) {
    fail('NEXT_PUBLIC_PUBLISHABLE_KEY is not set in .env.local');
    console.log('');
    console.log('  ┌─────────────────────────────────────────────────────┐');
    console.log('  │  Add this to your web/.env.local file:             │');
    console.log('  │                                                     │');
    console.log('  │  NEXT_PUBLIC_PUBLISHABLE_KEY=pk_mcs_global_<hex>   │');
    console.log('  │                                                     │');
    console.log('  │  Generate keys with:                                │');
    console.log('  │  curl -X POST http://localhost:5000/setup/init \     │');
    console.log('  │    -H "Content-Type: application/json" \            │');
    console.log('  │    -d \'{"name":"CEO","email":"ceo@school.com",\    │');
    console.log('  │          "password":"YourPass123"}\'                 │');
    console.log('  └─────────────────────────────────────────────────────┘');
  } else {
    // Check key format: must be pk_mcs_{branchCode}_{hex}
    const parts = PUB_KEY.split('_');
    if (parts.length < 4 || parts[0] !== 'pk' || parts[1] !== 'mcs') {
      fail(`Invalid publishable key format in .env.local`);
      console.log(`  Expected: pk_mcs_<branch>_<randomHex>`);
      console.log(`  Got:      ${PUB_KEY.substring(0, 30)}...`);
      console.log(`  Generate a new key via the key-manager or seed script.`);
    } else {
      ok(`Publishable API key: present (branch: ${parts[2]})`);
    }
  }

  // ─── 2. Secret API key — REQUIRED (server-side) ────────────
  if (!SEC_KEY) {
    fail('SECRET_KEY is not set in .env.local');
    console.log('');
    console.log('  ┌─────────────────────────────────────────────────────┐');
    console.log('  │  Add this to your web/.env.local file:             │');
    console.log('  │                                                     │');
    console.log('  │  SECRET_KEY=sk_mcs_global_<hex>                    │');
    console.log('  │                                                     │');
    console.log('  │  This is for server-side API calls (no NEXT_PUBLIC) │');
    console.log('  │  Generate keys with:                                │');
    console.log('  │  curl -X POST http://localhost:5000/setup/init \     │');
    console.log('  │    -H "Content-Type: application/json" \            │');
    console.log('  │    -d \'{"name":"CEO","email":"ceo@school.com",\    │');
    console.log('  │          "password":"YourPass123"}\'                 │');
    console.log('  └─────────────────────────────────────────────────────┘');
  } else {
    const parts = SEC_KEY.split('_');
    if (parts.length < 4 || parts[0] !== 'sk' || parts[1] !== 'mcs') {
      fail(`Invalid secret key format in .env.local`);
      console.log(`  Expected: sk_mcs_<branch>_<randomHex>`);
      console.log(`  Got:      ${SEC_KEY.substring(0, 30)}...`);
    } else {
      ok(`Secret API key: present (branch: ${parts[2]})`);
    }
  }

  // ─── 3. Other env vars ────────────────────────────────────
  if (process.env.NEXT_PUBLIC_API_URL) ok(`Backend API URL: ${config.apiUrl}`);
  if (APP_MODE) ok(`App Mode: ${APP_MODE}`);

  // ─── 4. Backend health check ─────────────────────────────
  log(`Checking backend at ${config.apiUrl}/health...`);
  try {
    const res = await fetch(`${config.apiUrl}/health`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      ok(`Backend API is reachable (${config.apiUrl})`);
    } else {
      fail(`Backend returned HTTP ${res.status}`);
    }
  } catch (e: any) {
    fail(`Backend API unreachable (${config.apiUrl}) — ${e.message}`);
  }

  // ─── 5. Verify keys against backend ──────────────────────
  // Publishable key
  if (PUB_KEY && !hasError) {
    log('Verifying publishable key against backend...');
    try {
      const res = await fetch(`${config.apiUrl}/health`, {
        headers: { 'x-publishable-api-key': PUB_KEY },
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        ok('Publishable key accepted by backend');
      } else {
        fail(`Backend rejected the publishable key (HTTP ${res.status})`);
        console.log(`  The key in .env.local doesn't match any key in the database.`);
        console.log(`  Generate a new key via key-manager or run the seed script.`);
      }
    } catch (e: any) {
      fail(`Could not verify publishable key: ${e.message}`);
    }
  }

  // Secret key
  if (SEC_KEY && !hasError) {
    log('Verifying secret key against backend...');
    try {
      const res = await fetch(`${config.apiUrl}/health`, {
        headers: { 'x-api-key': SEC_KEY },
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        ok('Secret key accepted by backend');
      } else {
        fail(`Backend rejected the secret key (HTTP ${res.status})`);
        console.log(`  The SECRET_KEY in .env.local doesn't match any key in the database.`);
      }
    } catch (e: any) {
      fail(`Could not verify secret key: ${e.message}`);
    }
  }

  // ─── 6. Result ────────────────────────────────────────────
  const border = '═'.repeat(48);
  console.log('');
  console.log(`  ╔${border}╗`);
  console.log(`  ║     🌐  Mother Care School — Website                   ║`);
  console.log(`  ║     ${APP_MODE === 'development' ? 'Development Mode' : 'Production Mode'}${' '.repeat(24)}║`);
  console.log(`  ╠${border}╣`);
  if (!hasError) {
    console.log(`  ║     ✅  All checks passed                               ║`);
  } else {
    console.log(`  ║     ❌  PREFLIGHT FAILED — see errors above             ║`);
  }
  console.log(`  ║     📅  ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`);
  console.log(`  ╚${border}╝`);
  console.log('');

  process.exit(hasError ? 1 : 0);
}

main().catch((e) => {
  fail(`Preflight error: ${e.message}`);
  process.exit(1);
});
