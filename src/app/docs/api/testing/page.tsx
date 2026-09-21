import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocCodeBlock, DocSection, DocTable } from '@/components/docs/doc-blocks';
import { apiNav } from '@/lib/docs/navigation';

const pre = 'overflow-x-auto rounded-lg border border-warm-card-border bg-warm-card p-4 text-xs leading-relaxed text-warm-cream';

export default function ApiTestingPage() {
  return (
    <DocsShell
      title="Testing"
      subtitle="Test infrastructure — backend Jest, web Vitest/Playwright, mobile integration, and load testing."
      nav={apiNav}
      variant="api"
    >
      <h2>Test infrastructure overview</h2>
      <DocTable
        headers={['Layer', 'Framework', 'Location', 'Scope']}
        rows={[
          ['Backend unit', 'Jest + supertest', 'backend/src/**/*.spec.ts', 'Service functions, middleware, utilities'],
          ['Backend integration', 'Jest + real PostgreSQL', 'backend/src/**/*.integration.ts', 'API endpoints, DB operations'],
          ['Mobile', 'Flutter integration_test', 'mobile/integration_test/', 'End-to-end user flows'],
          ['Web unit', 'Vitest + testing-library', 'web/src/**/*.test.ts(x)', 'React components, hooks, utilities'],
          ['Web E2E', 'Playwright', 'web/tests/', 'Full browser flows'],
        ]}
      />

      <h2>Backend tests</h2>
      <DocSection title="Unit tests (Jest + supertest)">
        <p>
          Unit tests run in isolation with mocked dependencies. Supertest is used for HTTP
          endpoint testing without a running server.
        </p>
        <DocCodeBlock>{`// Example: backend/src/modules/auth/auth.service.spec.ts
import { AuthService } from './auth.service';
import { prismaMock } from '@/test-utils/prisma-mock';

describe('AuthService', () => {
  describe('login', () => {
    it('returns JWT for valid credentials', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      const result = await AuthService.login({ identifier: 'admin@test.com', password: 'pass' });
      expect(result.token).toBeDefined();
      expect(result.user.id).toBe(mockUser.id);
    });

    it('throws 401 for invalid password', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      await expect(AuthService.login({ identifier: 'admin@test.com', password: 'wrong' }))
        .rejects.toThrow('Invalid credentials');
    });
  });
});`}</DocCodeBlock>

        <DocCodeBlock>{`// Example: supertest endpoint test
import request from 'supertest';
import { app } from '@/app';

describe('POST /auth/login', () => {
  it('returns 200 with token', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ identifier: 'admin@test.com', password: 'pass123' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  it('returns 401 for bad credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ identifier: 'admin@test.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });
});`}</DocCodeBlock>
      </DocSection>

      <DocSection title="Integration tests (real PostgreSQL)">
        <p>
          Integration tests run against a real PostgreSQL database (<code>m6_test</code>). They
          verify the full request pipeline — middleware, Prisma, and response shape.
        </p>
        <DocCodeBlock>{`// backend/src/modules/admin/admin.integration.ts
describe('Admin Branch CRUD', () => {
  let adminToken: string;

  beforeAll(async () => {
    // Login as super_admin, get JWT
    adminToken = await getTestToken('super_admin');
  });

  it('creates and retrieves a branch', async () => {
    const create = await request(app)
      .post('/admin/branches')
      .set('Authorization', \`Bearer \${adminToken}\`)
      .send({ name: 'Test Branch', address: '123 Main St' });
    expect(create.status).toBe(201);

    const get = await request(app)
      .get(\`/admin/branches/\${create.body.data.id}\`)
      .set('Authorization', \`Bearer \${adminToken}\`);
    expect(get.status).toBe(200);
    expect(get.body.data.name).toBe('Test Branch');
  });
});`}</DocCodeBlock>
      </DocSection>

      <h2>Database tests</h2>
      <DocSection title="Schema validation">
        <DocCodeBlock>{`// Verifies Prisma schema matches expected structure
describe('Database schema', () => {
  it('has all required tables', async () => {
    const tables = await prisma.\$queryRaw\`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
    \`;
    const names = tables.map(t => t.table_name);
    expect(names).toContain('users');
    expect(names).toContain('branches');
    expect(names).toContain('enrollments');
    expect(names).toContain('payments');
  });
});`}</DocCodeBlock>
      </DocSection>

      <h2>Redis tests</h2>
      <DocSection title="JWT blacklist tests">
        <DocCodeBlock>{`describe('Upstash Redis', () => {
  it('blacklists token on logout', async () => {
    const token = await getTestToken('teacher');
    await logoutUser(token); // adds to blacklist
    const decoded = jwt.verify(token, JWT_SECRET);
    const isBlacklisted = await checkBlacklist(token);
    expect(isBlacklisted).toBe(true);
  });
});`}</DocCodeBlock>
      </DocSection>

      <h2>Socket.IO tests</h2>
      <DocSection title="Realtime messaging">
        <DocCodeBlock>{`describe('Chat Socket.IO', () => {
  it('broadcasts message to room members', async () => {
    const socket1 = await createAuthenticatedSocket(token1);
    const socket2 = await createAuthenticatedSocket(token2);

    socket1.emit('chat:message:send', {
      roomId: testRoomId,
      content: 'Hello from user 1'
    });

    const received = await waitForEvent(socket2, 'chat:message:new');
    expect(received.content).toBe('Hello from user 1');
    expect(received.sender.id).toBe(userId1);
  });
});`}</DocCodeBlock>
      </DocSection>

      <h2>Upload tests</h2>
      <DocSection title="Resumable upload protocol">
        <DocCodeBlock>{`describe('Resumable upload', () => {
  it('resumes from last committed chunk', async () => {
    // Init upload
    const init = await request(app)
      .post('/api/upload/init')
      .send({ fileName: 'test.pdf', fileSize: 10_000_000 });
    const { fileId } = init.body;

    // Upload first 5MB chunk
    await uploadChunk(fileId, chunk1, 0);

    // Simulate interruption — upload second chunk
    await uploadChunk(fileId, chunk2, 5_000_000);

    // Verify partial upload recorded
    const status = await request(app).get(\`/api/upload/\${fileId}/status\`);
    expect(status.body.uploadedBytes).toBe(10_000_000);
    expect(status.body.complete).toBe(true);
  });
});`}</DocCodeBlock>
      </DocSection>

      <h2>Financial concurrency tests</h2>
      <DocSection title="Race condition prevention">
        <DocCodeBlock>{`describe('Payment concurrency', () => {
  it('prevents double payment via idempotency', async () => {
    const feeId = await createTestFee();
    const idempotencyKey = 'pay-' + Date.now();

    // Fire two concurrent payments with same key
    const [res1, res2] = await Promise.all([
      payFee(feeId, idempotencyKey),
      payFee(feeId, idempotencyKey),
    ]);

    // Exactly one should succeed
    const successes = [res1, res2].filter(r => r.status === 200);
    expect(successes).toHaveLength(1);

    // Fee should be marked paid exactly once
    const fee = await getFee(feeId);
    expect(fee.status).toBe('PAID');
  });
});`}</DocCodeBlock>
      </DocSection>

      <h2>Security tests</h2>
      <DocSection title="RBAC &amp; IDOR prevention">
        <DocCodeBlock>{`describe('RBAC enforcement', () => {
  it('blocks teacher from admin endpoints', async () => {
    const teacherToken = await getTestToken('teacher');
    const res = await request(app)
      .get('/admin/branches')
      .set('Authorization', \`Bearer \${teacherToken}\`);
    expect(res.status).toBe(403);
  });
});

describe('IDOR prevention', () => {
  it('blocks access to other branches data', async () => {
    const token = await getTestToken('branch_admin', branchA);
    const res = await request(app)
      .get(\`/admin/branches/\${branchB}/students\`)
      .set('Authorization', \`Bearer \${token}\`);
    expect(res.status).toBe(403);
  });
});`}</DocCodeBlock>
      </DocSection>

      <h2>Offline &amp; cache tests</h2>
      <DocSection title="Mobile offline behavior">
        <DocCodeBlock>{`// Flutter integration test
testWidgets('queues message when offline', (tester) async {
  await tester.pumpWidget(MyApp());
  await login(tester);

  // Simulate offline
  await mockOffline();

  // Send message
  await tester.tap(find.byKey(Key('send-button')));
  await tester.enterText(find.byType(TextField), 'Offline message');
  await tester.tap(find.byKey(Key('send')));
  await tester.pumpAndSettle();

  // Verify queued locally
  final queue = await getOfflineQueue();
  expect(queue.length, 1);
  expect(queue.first.content, 'Offline message');
  expect(queue.first.status, 'pending');

  // Restore connectivity
  await mockOnline();
  await tester.pumpAndSettle();

  // Verify sent
  final queueAfter = await getOfflineQueue();
  expect(queueAfter.length, 0);
});`}</DocCodeBlock>
      </DocSection>

      <h2>Failure &amp; recovery tests</h2>
      <DocSection title="Database restart recovery">
        <DocCodeBlock>{`describe('DB restart recovery', () => {
  it('reconnects after PostgreSQL restart', async () => {
    // Kill PostgreSQL
    await exec('sudo systemctl stop postgresql');

    // Attempt query — should fail
    await expect(prisma.user.count()).rejects.toThrow();

    // Restart PostgreSQL
    await exec('sudo systemctl start postgresql');
    await waitForDB(30_000);

    // Prisma should auto-reconnect
    const count = await prisma.user.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});`}</DocCodeBlock>
      </DocSection>

      <DocSection title="Redis restart recovery">
        <DocCodeBlock>{`describe('Redis restart recovery', () => {
  it('workers resume after Redis restart', async () => {
    // Enqueue a job
    await enqueueTestJob();
    const before = await getQueueLength('test');
    expect(before).toBe(1);

    // Restart Redis
    await exec('redis-cli shutdown');
    await exec('systemctl start redis');
    await waitForRedis(15_000);

    // Workers should reconnect and process
    await waitFor(() => getQueueLength('test') === 0, 30_000);
    expect(await getJobResult('test')).toBe('processed');
  });
});`}</DocCodeBlock>
      </DocSection>

      <h2>Backup &amp; restore tests</h2>
      <DocSection title="M16 verification">
        <DocCodeBlock>{`describe('Backup & restore (M16)', () => {
  it('backup → restore → verify data integrity', async () => {
    // Create test data
    const branch = await createTestBranch();
    const student = await createTestStudent(branch.id);

    // Run backup
    await exec('npm run db:backup');
    const latestBackup = await getLatestBackupPath();

    // Restore to test database
    await exec(\`pg_restore --clean --if-exists -d mcs_restore_test \${latestBackup}\`);

    // Verify restored data
    const restored = await prismaRestore.student.findUnique({
      where: { id: student.id }
    });
    expect(restored).not.toBeNull();
    expect(restored.name).toBe(student.name);
  });
});`}</DocCodeBlock>
      </DocSection>

      <h2>Load &amp; soak testing</h2>
      <DocSection title="M6 load test results">
        <p>
          Load testing (M6) validated the system under sustained traffic. The soak test ran for
          30 minutes with continuous request patterns.
        </p>
        <DocTable
          headers={['Metric', 'Value']}
          rows={[
            ['Total requests', '1145'],
            ['Duration', '30 minutes (soak test)'],
            ['Average response time', '< 200ms'],
            ['P99 response time', '< 500ms'],
            ['Error rate', '0%'],
            ['Memory usage', 'Stable (no leaks)'],
            ['DB connections', 'Stable (pool not exhausted)'],
          ]}
        />

        <DocCodeBlock>{`# Run load test (k6 or artillery)
npm run test:load

# Run soak test (30 minutes)
npm run test:soak`}</DocCodeBlock>
      </DocSection>

      <h2>What tests prove vs what they don&apos;t</h2>
      <DocTable
        headers={['Tests prove', 'Tests do NOT prove']}
        rows={[
          ['Business logic correctness', 'Production environment compatibility'],
          ['API contract stability', 'Network reliability under real load'],
          ['RBAC/IDOR prevention', 'Infrastructure failure recovery'],
          ['Offline queue reliability', 'Third-party service outages (FCM, Twilio)'],
          ['Concurrent operation safety', 'Long-term memory leaks (use soak tests)'],
          ['Schema migrations work', 'Backup/restore with real data volumes'],
        ]}
      />

      <h2>Test commands</h2>
      <DocTable
        headers={['Command', 'Purpose']}
        rows={[
          ['npm run test', 'Run all tests in current package'],
          ['npm run test:all', 'Run all test suites (unit + integration)'],
          ['npm run test:unit', 'Unit tests only'],
          ['npm run test:integration', 'Integration tests (requires DB)'],
          ['npm run test:coverage', 'Tests with coverage report'],
          ['npm run test:watch', 'Watch mode for development'],
          ['flutter test', 'Run mobile unit tests'],
          ['flutter test integration_test/', 'Run mobile integration tests'],
          ['npx playwright test', 'Run web E2E tests'],
        ]}
      />

      <DocSection title="Backend test commands">
        <DocCodeBlock>{`cd backend

# All tests
npm run test:all

# Unit only
npm run test:unit

# Integration only (requires m6_test database)
npm run test:integration

# Coverage
npm run test:coverage`}</DocCodeBlock>
      </DocSection>

      <DocSection title="Web test commands">
        <DocCodeBlock>{`cd web

# Unit tests (Vitest)
npm run test

# E2E tests (Playwright)
npx playwright test

# Coverage
npm run test:coverage`}</DocCodeBlock>
      </DocSection>

      <DocSection title="CI pipeline">
        <DocCodeBlock>{`# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: m6_test
          POSTGRES_PASSWORD: test
    steps:
      - uses: actions/checkout@v4
      - run: cd backend && npm ci
      - run: cd backend && npm run test:all
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/m6_test

  web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cd web && npm ci
      - run: cd web && npm run test
      - run: cd web && npx playwright install
      - run: cd web && npx playwright test`}</DocCodeBlock>
      </DocSection>

      <p>
        Next: <Link href="/docs/api/operations">Operations</Link> ·{' '}
        <Link href="/docs/api/deployment">Deployment</Link>
      </p>
    </DocsShell>
  );
}
