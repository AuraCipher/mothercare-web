/**
 * M22 — Shared manual-WhatsApp-handoff save helper (teacher/staff pages).
 *
 * Blank-window-first POST: opens `about:blank` synchronously in the click
 * gesture, awaits the save-credential endpoint, then navigates the window to
 * the wa.me URL. If the popup was blocked, the caller receives the SAME url
 * for a fallback link — no re-save, no regeneration.
 *
 * No provider calls. The only network request is the credential save itself.
 */
import { buildWhatsAppUrl, normalizePhoneDigits } from './whatsappCredential';

export interface ManualHandoffBody {
  password: string;
  adminPassword: string;
  replaceExisting: boolean;
  idempotencyKey?: string;
  branchId?: string;
  academicYearId?: string;
}

export interface ManualSaveData {
  website?: string;
  schoolName?: string;
  appUrl?: string;
  credentialSentAt?: string;
  credentialGeneratedAt?: string;
  idempotent?: boolean;
}

export type ManualHandoffResult =
  | { status: 'opened'; url: string; save: ManualSaveData }
  | { status: 'blocked'; url: string; save: ManualSaveData }
  | { status: 'failed'; code?: string; message: string };

export async function performManualHandoff(opts: {
  saveUrl: string;
  token: string | null;
  body: ManualHandoffBody;
  buildMessage: (save: ManualSaveData) => string;
  rawPhone: string;
}): Promise<ManualHandoffResult> {
  const popup = typeof window !== 'undefined' ? window.open('about:blank', '_blank') : null;
  let res: Response;
  try {
    res = await fetch(opts.saveUrl, {
      method: 'POST',
      headers: {
        ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(opts.body),
    });
  } catch {
    popup?.close();
    return { status: 'failed', message: 'Network error. Nothing was saved — safe to retry.' };
  }
  let data: any = {};
  try {
    data = await res.json();
  } catch {
    popup?.close();
    return { status: 'failed', message: 'Invalid server response. Nothing was saved.' };
  }
  if (!data.success) {
    popup?.close();
    return { status: 'failed', code: data.code, message: data.message || 'Save failed. Nothing was changed.' };
  }
  const save: ManualSaveData = data.data || {};
  const url = buildWhatsAppUrl(normalizePhoneDigits(opts.rawPhone), opts.buildMessage(save));
  if (popup && !popup.closed) {
    popup.location.href = url;
    return { status: 'opened', url, save };
  }
  return { status: 'blocked', url, save };
}
