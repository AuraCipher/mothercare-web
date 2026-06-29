import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* ── Server ──────────────────────────────────── */
  serverExternalPackages: ['dotenv'],

  /* ── Headers (CORS for backend) ──────────────── */
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

  /* ── Redirects ───────────────────────────────── */
  async redirects() {
    return [];
  },
};

export default nextConfig;
