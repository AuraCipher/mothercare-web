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
  apiUrl: env<string>('NEXT_PUBLIC_API_URL', 'http://localhost:5000'),

  // ── API Keys (for backend auth) ──────────────
  publishableKey: env<string>('NEXT_PUBLIC_PUBLISHABLE_KEY', ''),
  secretKey: env<string>('NEXT_PUBLIC_SECRET_KEY', ''),

  // ── Computed Helpers ─────────────────────────
  get isDev(): boolean {
    return this.appMode === 'development';
  },
  get isProd(): boolean {
    return this.appMode === 'production';
  },
} as const;

export default config;
