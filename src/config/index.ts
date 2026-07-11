// ─────────────────────────────────────────────────
// Mother Care School — Central Configuration
// NEXT_PUBLIC_* must use direct process.env references for Next.js build inlining.
// ─────────────────────────────────────────────────

export type AppMode = 'development' | 'production';

export const config = {
  // ── App ──────────────────────────────────────
  // Use direct process.env.NEXT_PUBLIC_* references so Next.js inlines them at build time.
  appMode: (process.env.NEXT_PUBLIC_APP_MODE || 'development') as AppMode,
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Mother Care School',

  // ── Backend Connection ───────────────────────
  apiUrl: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/+$/, ''),

  // ── API Keys (for backend auth) ──────────────
  publishableKey: process.env.NEXT_PUBLIC_PUBLISHABLE_KEY || '',
  secretKey: process.env.SECRET_KEY || '',

  // ── Computed Helpers ─────────────────────────
  get isDev(): boolean {
    return this.appMode === 'development';
  },
  get isProd(): boolean {
    return this.appMode === 'production';
  },
} as const;

export default config;
