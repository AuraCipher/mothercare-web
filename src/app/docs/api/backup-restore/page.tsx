import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocCodeBlock, DocSection, DocTable } from '@/components/docs/doc-blocks';
import { apiNav } from '@/lib/docs/navigation';

const pre = 'overflow-x-auto rounded-lg border border-warm-card-border bg-warm-card p-4 text-xs leading-relaxed text-warm-cream';

export default function ApiBackupRestorePage() {
  return (
    <DocsShell
      title="Backup & Restore"
      subtitle="PostgreSQL backup to Cloudflare R2 — pg_dump pipeline, integrity verification, and restore procedures."
      nav={apiNav}
      variant="api"
    >
      <h2>Backup format</h2>
      <p>
        Backups use PostgreSQL&apos;s custom format (<code>pg_dump -Fc</code>) which supports
        selective restore, compression, and is the recommended format for production backups.
      </p>

      <DocTable
        headers={['Property', 'Value']}
        rows={[
          ['Format', 'PostgreSQL custom (-Fc)'],
          ['Compression', 'Built-in zstd (default pg_dump behavior)'],
          ['Tool', 'pg_dump from PostgreSQL client libs'],
          ['Restore tool', 'pg_restore'],
          ['Object key format', 'db_backup/database-YYYY-MM-DD_HH-mm-ss.dump (UTC)'],
          ['Storage', 'Cloudflare R2 (S3-compatible)'],
          ['Retention', '30 days (DB_BACKUP_RETENTION_DAYS)'],
        ]}
      />

      <h2>Backup pipeline</h2>
      <DocSection title="Process flow">
        <pre className={pre}>
{`flowchart LR
  A[pg_dump -Fc] --> B[Temp file on disk]
  B --> C[SHA-256 checksum]
  C --> D[R2 Upload - 5MB multipart]
  D --> E[HeadObject verify]
  E --> F[Retention prune]`}
        </pre>

        <ol>
          <li><strong>pg_dump</strong> — streams PostgreSQL dump to a temporary file</li>
          <li><strong>SHA-256</strong> — computes checksum of the dump file</li>
          <li><strong>R2 Upload</strong> — uploads in 5MB parts (multipart upload)</li>
          <li><strong>HeadObject verify</strong> — confirms R2 object exists and size matches</li>
          <li><strong>Retention prune</strong> — deletes backups older than 30 days</li>
        </ol>
      </DocSection>

      <DocSection title="Integrity verification">
        <p>
          Every backup gets a SHA-256 checksum computed before upload. After upload, a HeadObject
          call verifies the remote object&apos;s size matches the local file. This catches
          truncated uploads and network corruption.
        </p>
        <DocCodeBlock>{`// Verification steps (in backup pipeline)
const checksum = await computeSHA256(dumpFilePath);
await uploadToR2(dumpFilePath, objectKey, { checksum });
const headResult = await headObject(objectKey);
assert(headResult.contentLength === localFileSize, 'Size mismatch');
// Checksum stored in R2 metadata for restore verification`}</DocCodeBlock>
      </DocSection>

      <DocSection title="Object naming">
        <DocCodeBlock>{`// Pattern: db_backup/database-YYYY-MM-DD_HH-mm-ss.dump
// Example:
db_backup/database-2026-03-15_02-00-00.dump
db_backup/database-2026-03-16_02-00-00.dump
db_backup/database-2026-03-17_02-00-00.dump`}</DocCodeBlock>
        <p>
          Timestamps are always UTC to avoid ambiguity across time zones. The prefix{' '}
          <code>db_backup/</code> keeps backup objects isolated from other R2 data.
        </p>
      </DocSection>

      <h2>Restore procedure</h2>
      <DocSection title="Full restore">
        <DocCodeBlock>{`# Download from R2
aws s3 cp s3://your-bucket/db_backup/database-2026-03-15_02-00-00.dump ./restore.dump

# Verify checksum
sha256sum ./restore.dump
# Compare with stored checksum in R2 metadata

# Restore (drops existing objects first)
pg_restore --clean --if-exists -d postgresql://user:pass@host:5432/dbname ./restore.dump`}</DocCodeBlock>

        <DocCallout variant="warn" title="Destructive operation">
          <code>--clean --if-exists</code> drops existing tables, sequences, and functions before
          restoring. Always verify you&apos;re targeting the correct database.
        </DocCallout>
      </DocSection>

      <DocSection title="Selective restore">
        <DocCodeBlock>{`# List contents of backup
pg_restore --list ./restore.dump

# Restore specific tables only
pg_restore --clean --if-exists -d DATABASE_URL \\
  -t students -t enrollments ./restore.dump

# Restore specific schema
pg_restore --clean --if-exists -d DATABASE_URL \\
  -n public ./restore.dump`}</DocCodeBlock>
      </DocSection>

      <h2>Backup verification</h2>
      <DocSection title="Automated verification (backup-verify.ts)">
        <p>
          The verification script restores a backup into a temporary database and runs a comprehensive
          suite of checks to confirm data integrity.
        </p>

        <h3>What it checks</h3>
        <DocTable
          headers={['Check', 'Count', 'Details']}
          rows={[
            ['Table existence', '44 tables', 'All expected tables present after restore'],
            ['Row counts', '42 counts', 'Non-zero counts for populated tables'],
            ['Aggregates', '10 aggregates', 'Sum/count/min/max across key financial and academic data'],
            ['Referential integrity', '—', 'Foreign key constraints pass'],
            ['Enum values', '—', 'All enum columns contain valid values'],
          ]}
        />

        <DocCodeBlock>{`# Run verification
npm run db:backup:verify

# Output (success)
✓ Restored 44 tables
✓ 42/42 row count checks passed
✓ 10/10 aggregate checks passed
✓ Referential integrity OK
✓ Verification complete in 34.2s`}</DocCodeBlock>
      </DocSection>

      <h2>VPS cron automation</h2>
      <DocSection title="vps-pg-backup.sh">
        <p>
          Production backups run via a cron job on the VPS. The script uses <code>flock</code> to
          prevent overlapping runs and respects the <code>DB_BACKUP_ENABLED</code> flag.
        </p>

        <DocCodeBlock>{`# Cron entry (daily at 2am UTC)
0 2 * * * /opt/mcs/scripts/vps-pg-backup.sh >> /var/log/mcs-backup.log 2>&1

# Script behavior:
# 1. Check DB_BACKUP_ENABLED env var (skip if false)
# 2. Acquire flock (non-blocking — skip if another run is active)
# 3. Run pg_dump pipeline
# 4. Upload to R2
# 5. Verify upload
# 6. Prune old backups
# 7. Log result`}</DocCodeBlock>

        <DocCallout variant="info" title="Flock protection">
          <code>flock -n /var/lock/mcs-backup.lock</code> ensures only one backup runs at a time.
          If a previous backup is still running, the new invocation exits immediately.
        </DocCallout>
      </DocSection>

      <h2>Environment variables</h2>
      <DocTable
        headers={['Variable', 'Purpose']}
        rows={[
          [<code>DATABASE_URL</code>, 'PostgreSQL connection string for pg_dump'],
          [<code>R2_ACCOUNT_ID</code>, 'Cloudflare account ID'],
          [<code>R2_ACCESS_KEY_ID</code>, 'R2 API access key'],
          [<code>R2_SECRET_ACCESS_KEY</code>, 'R2 API secret key'],
          [<code>R2_BUCKET</code>, 'R2 bucket name for backups'],
          [<code>DB_BACKUP_RETENTION_DAYS</code>, 'Days to keep backups (default 30)'],
          [<code>DB_BACKUP_ENABLED</code>, 'Enable/disable cron backups (true/false)'],
        ]}
      />

      <h2>npm scripts</h2>
      <DocTable
        headers={['Script', 'Command', 'Purpose']}
        rows={[
          ['db:backup', 'npm run db:backup', 'Run full backup pipeline (dump → upload → verify → prune)'],
          ['db:backup:restore-test', 'npm run db:backup:restore-test', 'Download latest backup, restore to temp DB, run checks'],
          ['db:backup:verify', 'npm run db:backup:verify', 'Verify latest backup integrity (44 tables, 42 counts, 10 aggregates)'],
        ]}
      />

      <DocSection title="Running a manual backup">
        <DocCodeBlock>{`# From the VPS
cd /opt/mcs/backend
npm run db:backup

# Or trigger via script directly
/opt/mcs/scripts/vps-pg-backup.sh`}</DocCodeBlock>
      </DocSection>

      <DocSection title="Running a restore test">
        <DocCodeBlock>{`# Downloads latest backup and restores to a temporary database
npm run db:backup:restore-test

# Output
✓ Downloaded database-2026-03-15_02-00-00.dump (42.3 MB)
✓ SHA-256 checksum verified
✓ Restored to temporary database mcs_restore_test
✓ 44/44 tables present
✓ 42/42 row count checks passed
✓ 10/10 aggregate checks passed
✓ Restore test complete in 48.7s`}</DocCodeBlock>
      </DocSection>

      <h2>Limitations</h2>
      <DocCallout variant="warn" title="Live R2 requires VPS credentials">
        Backup and restore operations require valid R2 credentials on the VPS. Local development
        cannot access the production R2 bucket without the VPS environment variables. Restore
        tests should be run on the VPS or a machine with the same R2 credentials.
      </DocCallout>

      <DocTable
        headers={['Limitation', 'Impact']}
        rows={[
          ['pg_dump requires same major version', 'Restore target must match or be newer PostgreSQL version'],
          ['Large databases', 'Dump size grows with data; 5MB multipart handles large files'],
          ['Restore downtime', 'Full restore requires DB downtime — use staging for testing'],
          ['No point-in-time recovery', 'pg_dump is logical backup — no WAL-based PITR'],
          ['R2 credentials on VPS only', 'Cannot run backup/restore from local dev without credentials'],
        ]}
      />

      <p>
        Next: <Link href="/docs/api/operations">Operations</Link> ·{' '}
        <Link href="/docs/api/deployment">Deployment</Link>
      </p>
    </DocsShell>
  );
}
