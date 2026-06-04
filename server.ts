/**
 * Mother Care School — Custom Next.js Server
 *
 * Optional custom server entry. Use `npx tsx server.ts` to run.
 * The standard `next dev` / `next start` workflow is preferred for most cases.
 */

import next from 'next';
import { createServer } from 'http';
import { parse } from 'url';

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);
const host = process.env.HOST || '127.0.0.1';

const app = next({ dev, hostname: host });
const handle = app.getRequestHandler();

function shutdown(signal: string, server: ReturnType<typeof createServer>) {
  console.log(`[server] ${signal} received, shutting down...`);
  server.close(() => {
    process.exit(0);
  });
}

app
  .prepare()
  .then(() => {
    const server = createServer((req, res) => {
      const parsedUrl = parse(req.url || '/', true);
      handle(req, res, parsedUrl);
    }).listen(port, host, () => {
      console.log(
        `[server] ⚡ Mother Care School ready on http://${host}:${port} (${dev ? 'development' : 'production'})`,
      );
    });

    process.on('SIGTERM', () => shutdown('SIGTERM', server));
    process.on('SIGINT', () => shutdown('SIGINT', server));
  })
  .catch((err) => {
    console.error('[server] Failed to start:', err);
    process.exit(1);
  });
