'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, Trash2, FileText } from 'lucide-react';
import { showToast } from '@/components/toast';
import ConfirmModal from '@/components/confirm-modal';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import * as XLSX from 'xlsx';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface FileMeta {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  width?: number | null;
  height?: number | null;
  createdAt: string;
}

type ViewerMode = 'loading' | 'image' | 'pdf' | 'markdown' | 'text' | 'video' | 'excel' | 'download' | 'error' | 'notfound';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const fetchWithAuth = (url: string) => {
  const token = localStorage.getItem('token');
  return fetch(url, { headers: { Authorization: `Bearer ${token}` } });
};

// ─── Image Viewer ──────────────────────────────────────────────
function ImageViewer({ src, alt }: { src: string; alt: string }) {
  const [zoomOpen, setZoomOpen] = useState(false);
  return (
    <>
      <img src={src} alt={alt} className="max-h-[70vh] max-w-full rounded-lg object-contain cursor-pointer mx-auto"
        onClick={() => setZoomOpen(true)} />
      {zoomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setZoomOpen(false)}>
          <img src={src} alt={alt} className="max-h-[90vh] max-w-[95vw] rounded-lg object-contain" />
        </div>
      )}
    </>
  );
}

// ─── PDF Viewer ────────────────────────────────────────────────
function PdfViewer({ src, name }: { src: string; name: string }) {
  return (
    <div className="h-[80vh] w-full rounded-lg border border-warm-card-border overflow-hidden bg-white/5">
      <iframe src={src} className="h-full w-full" title={name} />
    </div>
  );
}

// ─── Markdown Viewer ───────────────────────────────────────────
function MarkdownViewer({ content }: { content: string }) {
  // Strip YAML front matter (--- ... ---) at the start of the file
  const cleanContent = content.replace(/^---[\s\S]*?---\s*/m, '');

  if (cleanContent.length === 0) {
    return (
      <pre className="overflow-auto rounded-lg border border-warm-card-border bg-warm-card/30 p-6 text-sm text-warm-muted">
        (empty file)
      </pre>
    );
  }

  return (
    <div className="max-w-none rounded-lg border border-warm-card-border bg-warm-card/30 p-6">
      <div className="prose prose-sm prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSanitize]}
          components={{
            p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
            h1: ({ children }) => <h1 className="text-xl font-semibold mb-3 mt-6 text-warm-cream">{children}</h1>,
            h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 mt-5 text-warm-cream">{children}</h2>,
            h3: ({ children }) => <h3 className="text-base font-semibold mb-1 mt-4 text-warm-cream">{children}</h3>,
            ul: ({ children }) => <ul className="list-disc pl-6 mb-3 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-6 mb-3 space-y-1">{children}</ol>,
            li: ({ children }) => <li className="text-sm text-warm-cream/90">{children}</li>,
            code: ({ className, children, ...props }) => {
              const isInline = !className;
              if (isInline) {
                return <code className="rounded bg-warm-card/50 px-1.5 py-0.5 text-sm text-warm-accent">{children}</code>;
              }
              return (
                <pre className="overflow-auto rounded-lg bg-[#1a1614] p-4 mb-3">
                  <code className={`text-sm ${className || ''}`} {...props}>{children}</code>
                </pre>
              );
            },
            a: ({ children, href }) => (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-warm-accent hover:underline">{children}</a>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-2 border-warm-accent/50 pl-4 mb-3 italic text-warm-muted">{children}</blockquote>
            ),
            hr: () => <hr className="border-warm-card-border my-6" />,
            table: ({ children }) => (
              <div className="overflow-auto mb-3">
                <table className="w-full border-collapse text-sm">{children}</table>
              </div>
            ),
            th: ({ children }) => <th className="border border-warm-card-border px-3 py-2 text-left font-medium text-warm-cream bg-warm-card/50">{children}</th>,
            td: ({ children }) => <td className="border border-warm-card-border px-3 py-2 text-warm-cream/80">{children}</td>,
            strong: ({ children }) => <strong className="font-semibold text-warm-cream">{children}</strong>,
            em: ({ children }) => <em className="italic text-warm-cream/90">{children}</em>,
          }}>
          {cleanContent}
        </ReactMarkdown>
      </div>
    </div>
  );
}

// ─── Text Viewer ───────────────────────────────────────────────
function TextViewer({ content, language }: { content: string; language?: string }) {
  return (
    <pre className={`overflow-auto rounded-lg border border-warm-card-border bg-warm-card/30 p-6 text-sm text-warm-cream ${language ? `language-${language}` : ''}`}>
      <code>{content}</code>
    </pre>
  );
}

// ─── Excel Viewer ──────────────────────────────────────────────
function ExcelViewer({ data }: { data: Uint8Array }) {
  const [sheets, setSheets] = useState<{ name: string; rows: (string | number | boolean | null)[][] }[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      const workbook = XLSX.read(data, { type: 'array' });
      const parsed = workbook.SheetNames.map(name => {
        const worksheet = workbook.Sheets[name];
        const rows: (string | number | boolean | null)[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        return { name, rows };
      });
      setSheets(parsed);
    } catch {
      setError(true);
    }
  }, [data]);

  if (error) {
    return (
      <div className="rounded-lg border border-warm-card-border bg-warm-card/30 p-8 text-center">
        <p className="text-sm text-warm-muted">Could not parse this Excel file.</p>
        <p className="mt-1 text-xs text-warm-muted/50">Try downloading the file instead.</p>
      </div>
    );
  }

  if (sheets.length === 0) return null;

  const current = sheets[activeSheet];
  const hasData = current?.rows?.length > 0 && current.rows.some(r => r.some(c => c !== ''));

  return (
    <div>
      {/* Sheet tabs */}
      {sheets.length > 1 && (
        <div className="mb-4 flex gap-1 overflow-x-auto">
          {sheets.map((s, i) => (
            <button key={i} onClick={() => setActiveSheet(i)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs transition-colors ${
                i === activeSheet
                  ? 'bg-warm-accent text-[#1a1614] font-medium'
                  : 'bg-warm-card/50 text-warm-muted hover:text-warm-cream'
              }`}>
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="overflow-auto rounded-lg border border-warm-card-border max-h-[70vh]">
        <table className="w-full border-collapse text-xs" style={{ background: '#fff' }}>
          <tbody>
            {current?.rows.map((row, ri) => (
              <tr key={ri} className={ri === 0 ? 'bg-gray-50 font-semibold' : ri % 2 === 1 ? 'bg-white' : 'bg-gray-50/50'}>
                {row.map((cell, ci) => (
                  <td key={ci} className="border border-gray-300 px-2 py-1 text-gray-800 whitespace-nowrap min-w-[60px] max-w-[300px] overflow-hidden text-ellipsis">
                    {cell != null ? String(cell) : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!hasData && (
          <p className="text-xs text-gray-400 text-center py-8">This sheet appears to be empty.</p>
        )}
      </div>

      {hasData && (
        <p className="mt-1 text-[10px] text-gray-400 text-right">
          {current.rows.length} rows · {Math.max(...current.rows.map(r => r.length))} columns
        </p>
      )}
    </div>
  );
}

// ─── Video Viewer ──────────────────────────────────────────────
function VideoViewer({ src, name }: { src: string; name: string }) {
  return (
    <video src={src} controls className="max-h-[70vh] max-w-full rounded-lg mx-auto" title={name}>
      Your browser does not support video playback.
    </video>
  );
}

// ─── Download Prompt ───────────────────────────────────────────
function DownloadPrompt({ meta }: { meta: FileMeta }) {
  const typeLabel = meta.mimeType.split('/').pop()?.toUpperCase() || 'FILE';

  const handleDownload = () => {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/uploads/${meta.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = meta.originalName || 'download';
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => showToast('error', 'Download failed'));
  };

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-warm-card-border bg-warm-card/30 p-12 text-center">
      <FileText size={48} className="text-warm-muted/40 mb-4" />
      <p className="text-sm text-warm-cream font-medium mb-1">{meta.originalName}</p>
      <p className="text-xs text-warm-muted mb-6">{typeLabel} · {formatSize(meta.size)}</p>
      <p className="text-xs text-warm-muted/60 mb-4">Preview not available for this file type.</p>
      <button onClick={handleDownload}
        className="inline-flex items-center gap-2 rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors">
        <Download size={14} /> Download
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function DocumentViewerPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [meta, setMeta] = useState<FileMeta | null>(null);
  const [content, setContent] = useState<string | null>(null); // for text-based files
  const [blobUrl, setBlobUrl] = useState<string | null>(null); // for binary files
  const [excelData, setExcelData] = useState<Uint8Array | null>(null); // for excel files
  const [mode, setMode] = useState<ViewerMode>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const loadFile = useCallback(async () => {
    try {
      // 1. Fetch metadata
      const metaRes = await fetchWithAuth(`${API_URL}/api/uploads/${id}/meta`);
      if (metaRes.status === 401) { router.push('/login'); return; }
      if (metaRes.status === 404) { setMode('notfound'); return; }
      if (!metaRes.ok) { setMode('error'); setErrorMsg('Failed to load file metadata'); return; }
      const metaData = (await metaRes.json()).data as FileMeta;
      setMeta(metaData);

      const mime = metaData.mimeType;
      const isMdExtension = metaData.originalName?.toLowerCase().endsWith('.md');

      // 2. Determine viewer mode and load content
      if (mime.startsWith('image/')) {
        setMode('image');
        const fileRes = await fetchWithAuth(`${API_URL}/api/uploads/${id}`);
        const blob = await fileRes.blob();
        setBlobUrl(URL.createObjectURL(blob));
      } else if (mime === 'application/pdf') {
        setMode('pdf');
        const fileRes = await fetchWithAuth(`${API_URL}/api/uploads/${id}`);
        const blob = await fileRes.blob();
        setBlobUrl(URL.createObjectURL(blob));
      } else if (mime === 'text/markdown' || isMdExtension) {
        setMode('markdown');
        const fileRes = await fetchWithAuth(`${API_URL}/api/uploads/${id}`);
        setContent(await fileRes.text());
      } else if (mime.startsWith('text/') || mime === 'application/json' || mime === 'application/xml' || mime === 'application/typescript') {
        setMode('text');
        const fileRes = await fetchWithAuth(`${API_URL}/api/uploads/${id}`);
        setContent(await fileRes.text());
      } else if (mime.startsWith('video/')) {
        setMode('video');
        const fileRes = await fetchWithAuth(`${API_URL}/api/uploads/${id}`);
        const blob = await fileRes.blob();
        setBlobUrl(URL.createObjectURL(blob));
      } else if (mime.startsWith('application/vnd.ms-excel') || mime.includes('spreadsheetml')) {
        setMode('excel');
        const fileRes = await fetchWithAuth(`${API_URL}/api/uploads/${id}`);
        const buf = await fileRes.arrayBuffer();
        setExcelData(new Uint8Array(buf));
      } else {
        setMode('download');
      }
    } catch (e: any) {
      setMode('error');
      setErrorMsg(e.message || 'Failed to load file');
    }
  }, [id, router]);

  useEffect(() => { loadFile(); }, [loadFile]);

  // Cleanup blob URLs
  useEffect(() => {
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [blobUrl]);

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/uploads/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast('success', 'File deleted');
        router.back();
      } else {
        showToast('error', 'Failed to delete file');
      }
    } catch {
      showToast('error', 'Failed to delete file');
    }
  };

  const handleDownload = () => {
    const token = localStorage.getItem('token');
    // Use fetch and trigger download via blob to include auth
    fetch(`${API_URL}/api/uploads/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = meta?.originalName || 'download';
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => showToast('error', 'Download failed'));
  };

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#1a1614] text-warm-cream">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-warm-card-border px-6 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="rounded-lg p-1.5 text-warm-muted hover:bg-warm-card hover:text-warm-cream transition-colors">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-sm font-medium text-warm-cream truncate max-w-[300px] sm:max-w-[500px]">
              {meta?.originalName || 'Loading...'}
            </h1>
            {meta && <p className="text-[10px] text-warm-muted">{meta.mimeType} · {formatSize(meta.size)}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {meta && mode !== 'download' && (
            <button onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-lg border border-warm-card-border px-3 py-1.5 text-xs text-warm-cream hover:bg-warm-card transition-colors">
              <Download size={13} /> Download
            </button>
          )}
          <button onClick={() => setDeleteConfirmOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-red-900/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/10 transition-colors">
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </header>

      {/* Content area */}
      <main className="mx-auto max-w-5xl px-6 py-8">
        {mode === 'loading' && (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-warm-muted animate-pulse">Loading...</p>
          </div>
        )}

        {mode === 'notfound' && (
          <div className="flex flex-col items-center justify-center py-20">
            <FileText size={48} className="text-warm-muted/30 mb-4" />
            <p className="text-sm text-warm-muted">File not found</p>
          </div>
        )}

        {mode === 'error' && (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-sm text-red-400">{errorMsg || 'An error occurred'}</p>
          </div>
        )}

        {mode === 'image' && blobUrl && meta && (
          <ImageViewer src={blobUrl} alt={meta.originalName} />
        )}

        {mode === 'pdf' && blobUrl && meta && (
          <PdfViewer src={blobUrl} name={meta.originalName} />
        )}

        {mode === 'markdown' && content !== null && (
          <MarkdownViewer content={content} />
        )}

        {mode === 'text' && content !== null && (
          <TextViewer content={content} language={meta?.mimeType.split('/').pop()} />
        )}

        {mode === 'video' && blobUrl && meta && (
          <VideoViewer src={blobUrl} name={meta.originalName} />
        )}

        {mode === 'excel' && excelData && (
          <ExcelViewer data={excelData} />
        )}

        {mode === 'download' && meta && (
          <DownloadPrompt meta={meta} />
        )}
      </main>

      <ConfirmModal open={deleteConfirmOpen} title="Delete file"
        message="This will permanently delete this file and remove it from disk. This action cannot be undone."
        confirmLabel="Delete" variant="danger"
        onConfirm={handleDelete} onCancel={() => setDeleteConfirmOpen(false)} />
    </div>
  );
}
