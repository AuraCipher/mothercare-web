// ─────────────────────────────────────────────────
// Mother Care School — Central Configuration
// Reads all env vars from process.env (Next.js loads .env.local automatically)
// ─────────────────────────────────────────────────

function env<T>(key: string, fallback: T): T {
  const val = process.env[key];
  if (val === undefined || val === '') return fallback;
  // Handle numeric fallback — convert string to number
  if (typeof fallback === 'number') {
    const parsed = parseInt(val, 10);
    return (isNaN(parsed) ? fallback : parsed) as T;
  }
  return val as T;
}

export type AppMode = 'development' | 'production';

export const config = {
  // ── App ──────────────────────────────────────
  appMode: env<AppMode>('NEXT_PUBLIC_APP_MODE', 'development'),
  appName: env<string>('NEXT_PUBLIC_APP_NAME', 'Mother Care School'),

  // ── Backend Connection ───────────────────────
  // Sanitized: trailing slashes stripped so concatenation never produces //path
  apiUrl: env<string>('NEXT_PUBLIC_API_URL', 'http://localhost:5000').replace(/\/+$/, ''),

  // ── API Keys (for backend auth) ──────────────
  publishableKey: env<string>('NEXT_PUBLIC_PUBLISHABLE_KEY', ''),
  // secretKey is intentionally NOT in NEXT_PUBLIC_ — it must NEVER reach the browser.
  // It is only available server-side (SSR/SSG) and will be undefined in client components.
  secretKey: env<string>('SECRET_KEY', ''),

  // ── Computed Helpers ─────────────────────────
  get isDev(): boolean {
    return this.appMode === 'development';
  },
  get isProd(): boolean {
    return this.appMode === 'production';
  },
} as const;

export default config;
