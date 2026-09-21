import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocCodeBlock, DocSection, DocTable } from '@/components/docs/doc-blocks';
import { apiNav } from '@/lib/docs/navigation';

const pre = 'overflow-x-auto rounded-lg border border-warm-card-border bg-warm-card p-4 text-xs leading-relaxed text-warm-cream';

export default function ApiOperationsPage() {
  return (
    <DocsShell
      title="Operations"
      subtitle="Production runbooks — starting, stopping, health checks, migrations, backups, and emergency procedures."
      nav={apiNav}
      variant="api"
    >
      <h2>Starting the application</h2>
      <DocSection title="Development">
        <DocCodeBlock>{`# Backend (hot reload)
cd backend
npm run dev

# Web (hot reload)
cd web
npm run dev`}</DocCodeBlock>
      </DocSection>

      <DocSection title="Production">
        <DocCodeBlock>{`# Backend
cd backend
npm run build
NODE_ENV=production APP_MODE=production node dist/server.js

# Web
cd web
npm run build
npm run start`}</DocCodeBlock>
      </DocSection>

      <DocSection title="Docker">
        <DocCodeBlock>{`docker-compose up -d
# or
docker compose up -d`}</DocCodeBlock>
      </DocSection>

      <h2>Stopping the application</h2>
      <DocSection title="Graceful shutdown">
        <DocTable
          headers={['Signal', 'Behavior']}
          rows={[
            ['SIGTERM', 'Graceful shutdown — stop accepting connections, drain queues, close DB'],
            ['SIGINT', 'Same as SIGTERM (Ctrl+C)'],
            ['Force exit', '10-second timeout — process.kill() if cleanup stalls'],
          ]}
        />
        <DocCodeBlock>{`# Send SIGTERM to a running process
kill -TERM <pid>

# Docker
docker-compose stop backend`}</DocCodeBlock>
        <p>
          The shutdown sequence: stop HTTP server → close BullMQ workers → disconnect Socket.IO →
          close Prisma client → force exit after 10s.
        </p>
      </DocSection>

      <h2>Health checks</h2>
      <DocSection title="Endpoints">
        <DocTable
          headers={['Endpoint', 'Purpose', 'Returns']}
          rows={[
            ['GET /health/live', 'Liveness probe — is the process running?', '200 { status: "OK" }'],
            ['GET /health/ready', 'Readiness probe — can it serve traffic?', '200 when DB + Redis reachable'],
            ['GET /health/deep', 'Deep check — all subsystems', '200 with subsystem status breakdown'],
          ]}
        />

        <DocCodeBlock>{`curl -s https://api.example.com/health/live | jq
{
  "status": "OK",
  "timestamp": "2026-03-15T12:00:00.000Z"
}

curl -s https://api.example.com/health/deep | jq
{
  "status": "OK",
  "checks": {
    "database": "OK",
    "redis": "OK",
    "upstash": "OK",
    "workers": { "messages": "OK", "chat": "OK" }
  }
}`}</DocCodeBlock>
      </DocSection>

      <h2>Startup checks</h2>
      <DocSection title="runStartupChecks() — server.ts">
        <p>
          On boot, the server runs a series of startup checks. Critical failures exit the process;
          non-critical failures log warnings.
        </p>
        <DocTable
          headers={['Check', 'Critical?', 'Failure behavior']}
          rows={[
            ['Environment variables (Zod)', 'Yes', 'Process exits — invalid config'],
            ['PostgreSQL connectivity', 'Yes', 'Process exits'],
            ['Grade scale seed', 'No', 'Idempotent insert — non-fatal if exists'],
            ['Upstash Redis REST', 'No', 'Warns — JWT blacklist disabled if unreachable'],
            ['Redis TCP (BullMQ)', 'No', 'Warns — synchronous fallback; no push fanout'],
          ]}
        />
      </DocSection>

      <h2>PostgreSQL operations</h2>
      <DocSection title="Connecting">
        <DocCodeBlock>{`# Direct connection
psql $DATABASE_URL

# From within the VPS
psql -U postgres -d mcs_production`}</DocCodeBlock>
      </DocSection>

      <DocSection title="Running migrations">
        <DocCodeBlock>{`cd backend

# Apply pending migrations
npx prisma migrate deploy

# Generate Prisma client (after schema changes)
npx prisma generate

# Create a new migration (development only)
npx prisma migrate dev --name add_canteen_module`}</DocCodeBlock>

        <DocCallout variant="warn" title="Never run migrate dev in production">
          <code>prisma migrate dev</code> is for development only — it may reset data or create
          shadow databases. Use <code>prisma migrate deploy</code> in production.
        </DocCallout>
      </DocSection>

      <DocSection title="Introspection">
        <DocCodeBlock>{`# View current schema state
npx prisma introspect

# Generate ERD
npx prisma generate --generator=erd`}</DocCodeBlock>
      </DocSection>

      <h2>Redis operations</h2>
      <DocSection title="Upstash Redis REST">
        <p>
          Used for JWT blacklist. Check connectivity via the Upstash console or REST API.
        </p>
        <DocCodeBlock>{`# Test Upstash connection
curl -s https://<upstash-url>/ping -H "Authorization: Bearer <token>"
"PONG"`}</DocCodeBlock>
      </DocSection>

      <DocSection title="Redis TCP (BullMQ)">
        <p>
          Used for BullMQ queues and Socket.IO adapter. Requires TCP connectivity.
        </p>
        <DocCodeBlock>{`# Test Redis TCP
redis-cli -h <host> -p 6379 ping
PONG

# Check queue lengths
redis-cli -h <host> -p 6379 LLEN bull:messages:wait
redis-cli -h <host> -p 6379 LLEN bull:chat:wait`}</DocCodeBlock>
      </DocSection>

      <h2>Worker status</h2>
      <DocSection title="Checking workers">
        <DocTable
          headers={['Worker', 'Queue', 'Check']}
          rows={[
            ['message.worker', 'messages', 'BullMQ dashboard or redis-cli LLEN bull:messages:wait'],
            ['chat.worker', 'chat', 'BullMQ dashboard or redis-cli LLEN bull:chat:wait'],
            ['media.worker', 'media', 'BullMQ dashboard or redis-cli LLEN bull:media:wait'],
          ]}
        />
        <DocCodeBlock>{`# Check all queue lengths at once
redis-cli -h <host> -p 6379 eval "
  local keys = redis.call('keys', 'bull:*:wait')
  local result = {}
  for i, key in ipairs(keys) do
    result[key] = redis.call('llen', key)
  end
  return result
" 0`}</DocCodeBlock>
      </DocSection>

      <h2>Running backups</h2>
      <DocSection title="Trigger backup">
        <DocCodeBlock>{`cd /opt/mcs/backend

# Full backup pipeline
npm run db:backup

# Verify latest backup
npm run db:backup:verify

# Restore test
npm run db:backup:restore-test`}</DocCodeBlock>
        <p>
          See <Link href="/docs/api/backup-restore">Backup &amp; Restore</Link> for full details.
        </p>
      </DocSection>

      <h2>Handling failures</h2>
      <DocSection title="Failed backup">
        <DocCodeBlock>{`# Check backup logs
tail -50 /var/log/mcs-backup.log

# Common issues:
# - R2 credentials expired → update R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY
# - Disk full → clean temp files, check df -h
# - PostgreSQL connection refused → check DATABASE_URL, pg_isready`}</DocCodeBlock>
      </DocSection>

      <DocSection title="Failed worker">
        <DocCodeBlock>{`# Check worker logs
docker-compose logs --tail=100 backend | grep -i worker

# Restart worker (reloads on next job)
# Workers auto-recover when Redis reconnects
# If stuck: restart the backend process
kill -TERM <pid> && systemctl restart mcs-backend`}</DocCodeBlock>
      </DocSection>

      <DocSection title="Redis restart">
        <DocCodeBlock>{`# Restart Redis (Upstash: restart via dashboard)
# Self-hosted:
redis-cli shutdown
systemctl start redis

# Verify after restart
redis-cli ping
# Workers auto-reconnect to Redis`}</DocCodeBlock>
      </DocSection>

      <DocSection title="PostgreSQL restart">
        <DocCodeBlock>{`# Restart PostgreSQL
sudo systemctl restart postgresql

# Verify
pg_isready -h localhost -p 5432
# Backend auto-reconnects via Prisma connection pool`}</DocCodeBlock>
      </DocSection>

      <h2>Monitoring</h2>
      <DocSection title="Disk space">
        <DocCodeBlock>{`# Check disk usage
df -h /var/lib/postgresql
df -h /opt/mcs

# Check backup disk usage
du -sh /tmp/*.dump 2>/dev/null
du -sh /opt/mcs/backend/uploads/`}</DocCodeBlock>
      </DocSection>

      <DocSection title="Memory monitoring">
        <DocCodeBlock>{`# Check Node.js memory
node -e "console.log(process.memoryUsage())"

# Check system memory
free -h
top -bn1 | head -20`}</DocCodeBlock>
      </DocSection>

      <h2>Emergency procedures</h2>
      <DocSection title="Emergency rollback">
        <DocCodeBlock>{`# Database restore from backup
cd /opt/mcs/backend
npm run db:backup:restore-test  # verify backup first
# Then restore to production:
pg_restore --clean --if-exists -d $DATABASE_URL ./latest.dump

# Git revert to last known good
git log --oneline -5
git revert HEAD  # or specific commit
npm run build && npm run start`}</DocCodeBlock>
        <DocCallout variant="warn" title="Coordinate rollbacks">
          Database restores and code rollbacks should be coordinated. A schema-incompatible
          rollback can cause data loss. Always verify backup compatibility before restoring.
        </DocCallout>
      </DocSection>

      <DocSection title="Emergency checklist">
        <DocTable
          headers={['Severity', 'Action']}
          rows={[
            ['API down', 'Check process status → restart → check logs → check DB connectivity'],
            ['Database down', 'Check pg_isready → restart PostgreSQL → check disk space → check connections'],
            ['Redis down', 'Check redis-cli ping → restart → verify BullMQ reconnects'],
            ['Workers stuck', 'Check queue lengths → restart backend → verify jobs process'],
            ['Disk full', 'Check df -h → clean temp files → check backup retention → clean uploads'],
            ['Memory spike', 'Check free -h → restart Node process → check for memory leaks'],
          ]}
        />
      </DocSection>

      <p>
        Next: <Link href="/docs/api/deployment">Deployment</Link> ·{' '}
        <Link href="/docs/api/backup-restore">Backup &amp; Restore</Link> ·{' '}
        <Link href="/docs/api/testing">Testing</Link>
      </p>
    </DocsShell>
  );
}
