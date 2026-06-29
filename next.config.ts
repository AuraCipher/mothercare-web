import type { NextConfig } from 'next';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:5000';

const nextConfig: NextConfig = {
  /* ── Server ──────────────────────────────────── */
  serverExternalPackages: ['dotenv'],

  /* ── Headers ─────────────────────────────────── */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },

  /* ── Rewrites (proxy API calls to backend, no CORS needed) ── */
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${BACKEND_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
