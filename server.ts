/**
 * Mother Care School — Custom Next.js Server
 *
 * Performs health checks before starting:
 *   1. Loads .env.local via dotenv
 *   2. Verifies required env vars
 *   3. Checks backend API health
 *   4. Starts Next.js with beautiful banner
 *   5. Graceful shutdown on SIGTERM/SIGINT
 */

import dotenv from 'dotenv';
import next from 'next';
import { createServer } from 'http';
import { parse } from 'url';
import config from './src/config';

// ─── Load .env.local ──────────────────────────────────────
dotenv.config({ path: '.env.local' });

// ─── Helpers ──────────────────────────────────────────────
const ts = () => new Date().toISOString().replace('T', ' ').slice(0, 19);
const log = (msg: string) => console.log(`[${ts()}]  ${msg}`);
const warn = (msg: string) => console.warn(`[${ts()}]  ⚠ ${msg}`);
const err = (msg: string) => console.error(`[${ts()}]  ❌ ${msg}`);

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);
const host = process.env.HOST || '127.0.0.1';
const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Mother Care School';

// ─── REQUIRED ENV VARS ────────────────────────────────────
const requiredVars: { key: string; label: string }[] = [
  { key: 'NEXT_PUBLIC_API_URL', label: 'Backend API URL' },
  { key: 'NEXT_PUBLIC_APP_MODE', label: 'App Mode' },
];

// ─── Startup ──────────────────────────────────────────────
async function main() {
  const checks: { name: string; status: 'ok' | 'fail'; detail?: string }[] = [];

  // 1. ENV vars check
  log('Checking environment variables...');
  let allEnvOk = true;
  for (const v of requiredVars) {
    if (process.env[v.key]) {
      checks.push({ name: v.label, status: 'ok' });
    } else {
      checks.push({ name: v.label, status: 'fail', detail: 'Not set' });
      allEnvOk = false;
    }
  }
  if (allEnvOk) log('All required env vars present');

  // 2. Backend health check
  log(`Checking backend API at ${config.apiUrl}...`);
  try {
    const res = await fetch(`${config.apiUrl}/health`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      checks.push({ name: 'Backend API', status: 'ok', detail: config.apiUrl });
      log('Backend API is reachable');
    } else {
      checks.push({ name: 'Backend API', status: 'fail', detail: `HTTP ${res.status}` });
    }
  } catch (e: any) {
    checks.push({ name: 'Backend API', status: 'fail', detail: e.message });
    warn(`Backend API unreachable (${e.message}) — frontend will still start`);
  }

  // 3. Print banner
  const border = '═'.repeat(52);
  const allOk = checks.every((c) => c.status === 'ok');
  console.log('');
  console.log(`  ╔${border}╗`);
  console.log(`  ║        🌐  Mother Care School — Website                   ║`);
  console.log(`  ║        ${appName.padEnd(40)}║`);
  console.log(`  ╠${border}╣`);
  for (const c of checks) {
    const icon = c.status === 'ok' ? ' ✅' : ' ⚠️';
    console.log(`  ${icon}    ${(c.name + ':').padEnd(16)}  ${c.detail || ''}`);
  }
  console.log(`  ╠${border}╣`);
  console.log(`  ║     📅  ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`);
  console.log(`  ║     🔧  ${dev ? 'Development Mode' : 'Production Mode'}`);
  console.log(`  ╚${border}╝`);
  console.log('');

  // 4. Start Next.js
  const app = next({ dev, hostname: host });
  const handle = app.getRequestHandler();

  app.prepare().then(() => {
    const server = createServer((req, res) => {
      const parsedUrl = parse(req.url || '/', true);
      handle(req, res, parsedUrl);
    }).listen(port, host, () => {
      console.log(`  🌐  ${appName} ready on http://${host}:${port}`);
      console.log(`  🔗  Backend: ${config.apiUrl}`);
      console.log(`  📋  Login:   http://${host}:${port}/login`);
      if (dev) console.log(`  🔄  File watching enabled (tsx watch)`);
      console.log('');
    });

    // Graceful shutdown
    const shutdown = (signal: string) => {
      console.log(`\n[${ts()}]  ${signal} received, shutting down...`);
      server.close(() => {
        console.log(`[${ts()}]  Server closed.`);
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  });
}

main().catch((e) => {
  err(`Failed to start: ${e.message}`);
  process.exit(1);
});
