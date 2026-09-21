import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocCodeBlock, DocSection, DocTable } from '@/components/docs/doc-blocks';
import { apiNav } from '@/lib/docs/navigation';

const pre = 'overflow-x-auto rounded-lg border border-warm-card-border bg-warm-card p-4 text-xs leading-relaxed text-warm-cream';

export default function ApiFilesMediaPage() {
  return (
    <DocsShell
      title="Files & Media"
      subtitle="Upload pipeline, Cloudflare R2 storage, resumable uploads, and file authorization."
      nav={apiNav}
      variant="api"
    >
      <h2>Overview</h2>
      <p>
        The file system handles document storage, media processing, and upload management. Production
        uses Cloudflare R2 for storage; development falls back to local filesystem. All uploads flow
        through a streaming-first pipeline with authorization checks.
      </p>

      <DocTable
        headers={['Property', 'Value']}
        rows={[
          ['Primary storage', 'Cloudflare R2 (S3-compatible)'],
          ['Dev fallback', 'LocalStorageAdapter (filesystem)'],
          ['Buckets', 'mcs-documents, mcs-backups'],
          ['Chunk size', '5 MiB (resumable uploads)'],
          ['Media processing', 'Sharp (profile: 300px, chat: 2048px)'],
          ['MIME types', '40+ allowed types'],
        ]}
      />

      <DocSection title="Storage adapters">
        <DocCodeBlock>{`// Storage adapter interface
interface StorageAdapter {
  upload(key: string, body: ReadableStream): Promise<void>;
  download(key: string): Promise<ReadableStream>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
}

// Production: R2StorageAdapter
// Development: LocalStorageAdapter`}</DocCodeBlock>

        <h3>Buckets</h3>
        <DocTable
          headers={['Bucket', 'Purpose', 'Access']}
          rows={[
            ['mcs-documents', 'Student docs, receipts, report cards', 'Authenticated + authorization'],
            ['mcs-backups', 'Database backups, system exports', 'Admin only'],
          ]}
        />
      </DocSection>

      <DocSection title="Upload routes">
        <h3>Single-shot upload</h3>
        <DocCodeBlock>{`POST /upload
Authorization: Bearer <jwt>
Content-Type: multipart/form-data

// Form fields:
// - file: File (required)
// - entityType: "student" | "teacher" | "staff" | "chat" | ...
// - entityId: UUID of the related entity
// - purpose: "profile" | "document" | "chat_media" | ...

Response 201:
{
  "success": true,
  "data": {
    "id": "file-uuid",
    "url": "https://storage.example.com/...",
    "mimeType": "image/jpeg",
    "size": 1024000
  }
}`}</DocCodeBlock>

        <h3>Resumable upload</h3>
        <p>
          For large files, use the resumable upload protocol. The client initiates an upload session,
          sends chunks, and finalizes. If interrupted, the client can resume from the last successful
          chunk.
        </p>
        <DocCodeBlock>{`// Step 1: Initiate upload
POST /uploads/initiate
{
  "fileName": "report-card.pdf",
  "fileSize": 5242880,
  "mimeType": "application/pdf",
  "entityType": "student",
  "entityId": "student-uuid"
}

Response 201:
{
  "uploadId": "upload-uuid",
  "chunkSize": 5242880,  // 5 MiB
  "totalChunks": 1
}

// Step 2: Upload chunks
PUT /uploads/:uploadId/chunks/:chunkNumber
Content-Type: application/octet-stream
Body: <chunk binary data>

// Step 3: Finalize
POST /uploads/:uploadId/complete`}</DocCodeBlock>
      </DocSection>

      <DocSection title="UploadSession state machine">
        <pre className={pre}>
{`INITIATED ──> UPLOADING ──> COMPLETED
    │              │
    │              ├──> FAILED
    │              │
    │              └──> CANCELLED
    │
    └──> EXPIRED (after timeout)`}
        </pre>
        <DocTable
          headers={['State', 'Description']}
          rows={[
            ['INITIATED', 'Session created, awaiting first chunk'],
            ['UPLOADING', 'At least one chunk received'],
            ['COMPLETED', 'All chunks received and assembled'],
            ['FAILED', 'Upload error or timeout'],
            ['CANCELLED', 'User cancelled the upload'],
            ['EXPIRED', 'Session timed out (default: 24 hours)'],
          ]}
        />
      </DocSection>

      <DocSection title="MIME type handling">
        <h3>Allowed types</h3>
        <p>
          The system accepts 40+ MIME types including images, documents, audio, video, and archives.
          Dangerous types (HTML, SVG, JavaScript) are reclassified as <code>application/octet-stream</code>{' '}
          to prevent XSS.
        </p>

        <h3>Dangerous MIME override</h3>
        <DocCodeBlock>{`// Dangerous MIME types are neutralized
const DANGEROUS_MIMES = [
  'text/html',
  'image/svg+xml',
  'application/javascript',
  'text/javascript',
];

// If detected, override to:
'application/octet-stream'

// This forces download instead of rendering
// Prevents XSS via uploaded HTML/SVG files`}</DocCodeBlock>

        <h3>Common allowed types</h3>
        <DocTable
          headers={['Category', 'Types']}
          rows={[
            ['Images', 'image/jpeg, image/png, image/webp, image/gif, image/heic'],
            ['Documents', 'application/pdf, text/csv, application/msword, ...'],
            ['Audio', 'audio/mpeg, audio/wav, audio/ogg'],
            ['Video', 'video/mp4, video/webm, video/quicktime'],
            ['Archives', 'application/zip, application/gzip, ...'],
          ]}
        />
      </DocSection>

      <DocSection title="File authorization (R2-04)">
        <p>
          File access is governed by the R2-04 authorization policy. Access is granted based on user
          role and relationship to the file.
        </p>
        <DocTable
          headers={['Role', 'Access']}
          rows={[
            ['super_admin', 'Full access to all files'],
            ['File owner', 'Access to own files'],
            ['Entity关联', 'Access to files linked to their entity (student, teacher, etc.)'],
            ['Chat media', 'Participants in the chat room can access shared media'],
          ]}
        />
        <DocCodeBlock>{`// Authorization check
async function canAccessFile(userId: string, file: FileRecord) {
  // 1. Super admin — always allowed
  if (user.role === 'super_admin') return true;

  // 2. File owner
  if (file.uploadedBy === userId) return true;

  // 3. Entity关联
  if (file.entityType && file.entityId) {
    const hasAccess = await checkEntityAccess(userId, file.entityType, file.entityId);
    if (hasAccess) return true;
  }

  // 4. Chat media — check room membership
  if (file.purpose === 'chat_media') {
    const isMember = await checkChatRoomMembership(userId, file.entityId);
    if (isMember) return true;
  }

  return false;
}`}</DocCodeBlock>
      </DocSection>

      <DocSection title="Storage paths">
        <DocCodeBlock>{`// Storage path convention
{bucket}/{purpose}/{entityType}/{entityId}/{filename}

// Examples:
mcs-documents/profiles/students/uuid-123/photo.jpg
mcs-documents/documents/students/uuid-123/nic.pdf
mcs-documents/chat/rooms/uuid-456/image.png
mcs-backups/database/2026-03-15/backup.sql.gz`}</DocCodeBlock>
      </DocSection>

      <DocSection title="Media pipeline">
        <p>
          Image uploads pass through Sharp for optimization. Profile photos are resized to 300px max
          dimension. Chat images are resized to 2048px max dimension. All images are converted to
          WebP for smaller file sizes.
        </p>
        <DocCodeBlock>{`// Media processing pipeline
async function processMedia(file: FileRecord) {
  if (file.mimeType.startsWith('image/')) {
    const dimensions = file.purpose === 'profile' ? 300 : 2048;

    const processed = await sharp(file.buffer)
      .resize(dimensions, dimensions, { fit: 'inside' })
      .webp({ quality: 85 })
      .toBuffer();

    // Upload processed version
    await storage.upload(processedPath, processed);
  }
}`}</DocCodeBlock>
      </DocSection>

      <DocCallout variant="info" title="Streaming-first">
        All uploads use streaming via busboy. Files are never fully buffered in memory. The pipeline
        streams directly to temp storage, then to the final storage adapter.
      </DocCallout>

      <p>
        Next: <Link href="/docs/api/results">Results &amp; Exams</Link> ·{' '}
        <Link href="/docs/api/attendance">Attendance</Link>
      </p>
    </DocsShell>
  );
}
