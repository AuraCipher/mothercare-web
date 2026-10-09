'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

const RELEASES_API =
  'https://api.github.com/repos/mothercaresoftwares/mothercare-mobile/releases/latest';

// Pinned fallback so the button always works even when the GitHub API is
// rate-limited or unreachable — points at the known-good release asset.
const FALLBACK = {
  version: 'v1.0.0',
  url: 'https://github.com/mothercaresoftwares/mothercare-mobile/releases/download/v1.0.0/Mother.Care.apk',
  sizeBytes: 69_849_803,
  publishedAt: '2026-10-09T17:10:01Z',
};

type ReleaseInfo = {
  version: string;
  url: string;
  sizeBytes: number;
  publishedAt: string | null;
};

type GithubAsset = {
  name?: string;
  size?: number;
  browser_download_url?: string;
};

type GithubRelease = {
  tag_name?: string;
  published_at?: string | null;
  assets?: GithubAsset[];
};

function formatSize(bytes: number): string | null {
  if (!bytes || !Number.isFinite(bytes)) return null;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Download CTA that always targets the latest GitHub release asset.
 *
 * The GitHub asset URL serves `Content-Disposition: attachment`, so the
 * browser starts the download in-place — the visitor never leaves this page.
 * Version/size/date refresh from the GitHub API on mount; on failure the
 * pinned v1.0.0 values stay in effect.
 */
export function DownloadAppButton() {
  const [release, setRelease] = useState<ReleaseInfo>(FALLBACK);

  useEffect(() => {
    let cancelled = false;

    fetch(RELEASES_API)
      .then((res) => (res.ok ? (res.json() as Promise<GithubRelease>) : null))
      .then((data) => {
        if (cancelled || !data || !Array.isArray(data.assets)) return;
        const asset =
          data.assets.find((a) => a.name?.toLowerCase().endsWith('.apk')) ?? data.assets[0];
        if (!asset?.browser_download_url) return;
        setRelease({
          version: data.tag_name?.trim() || FALLBACK.version,
          url: asset.browser_download_url,
          sizeBytes: asset.size ?? FALLBACK.sizeBytes,
          publishedAt: data.published_at ?? null,
        });
      })
      .catch(() => {
        /* keep the pinned fallback */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const size = formatSize(release.sizeBytes);
  const date = formatDate(release.publishedAt);
  const meta = [release.version, size, 'Android 7.0+', date].filter(Boolean).join('  ·  ');

  return (
    <div className="flex flex-col items-center">
      <a
        href={release.url}
        download
        className="inline-flex items-center gap-3 rounded-xl bg-warm-accent px-10 py-4 text-base font-medium text-[#1a1614] shadow-lg shadow-black/30 transition-all hover:bg-[#b39a76] hover:shadow-warm-accent/25 active:scale-[0.98]"
      >
        <Download size={20} aria-hidden="true" />
        Download for Android
      </a>

      <p className="mt-4 text-xs text-warm-muted" aria-live="polite">
        {meta}
      </p>
      <p className="mt-1 text-[11px] text-warm-muted/70">
        Direct download &mdash; you stay on this page
      </p>
    </div>
  );
}
