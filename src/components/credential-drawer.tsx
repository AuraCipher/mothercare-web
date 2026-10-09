'use client';

/**
 * Shared credential drawer (M22+): student / teacher / staff manual WhatsApp handoff.
 *
 * One component, one state machine, one icon entry point:
 *   READY → GENERATED → SAVE_AUTH → SAVE_SUCCESS → WHATSAPP opened / blocked
 *   PASSWORD_REPLACEMENT_REQUIRED → confirm → back with exact P1, zero mutation on Cancel.
 *
 * The drawer builds the type-correct local message, POSTs the matching
 * save-credential endpoint, and opens wa.me prefilled. No provider calls.
 */
import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, Eye, EyeOff, X, KeyRound } from 'lucide-react';
import { showToast } from '@/components/toast';
import ConfirmModal from '@/components/confirm-modal';
import {
  buildStaffCredentialMessage,
  buildStudentCredentialMessage,
  buildTeacherCredentialMessage,
  formatClassLabel,
  generateSecurePassword,
  normalizePhoneDigits,
  buildWhatsAppUrl,
} from '@/lib/whatsappCredential';

export type CredentialPersonType = 'student' | 'teacher' | 'staff';

export interface CredentialDrawerPerson {
  id: string;
  type: CredentialPersonType;
  name: string;
  username: string | null;
  /** Resolved raw recipient number (students: parent/guardian whatsapp||phone; teacher/staff: profile||user phone). */
  phone: string | null;
  /** Student only: pre-formatted class label (formatClassLabel applied by caller). */
  classLabel?: string | null;
  /** Staff only: authoritative designation (workRole → branch role). */
  designation?: string | null;
  hasExistingPassword: boolean;
  /** Full save-credential endpoint URL (branch scope baked in by caller). */
  saveUrl: string;
  branchId?: string | null;
}

interface CredentialDrawerProps {
  person: CredentialDrawerPerson | null;
  /** Drive the slide animation; drawer unmounts after slide-out. */
  open: boolean;
  onClose: () => void;
  /** Focus returns here after close. */
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
  /** Parent applies authoritative row updates (timestamps/status). */
  onSaved?: (personId: string, updates: Record<string, any>) => void;
}

type Phase = 'ready' | 'generated' | 'saving' | 'blocked' | 'done';

const TYPE_TITLE: Record<CredentialPersonType, string> = {
  student: 'Student Credentials',
  teacher: 'Teacher Credentials',
  staff: 'Staff Credentials',
};

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '—';
  const t = phone.trim();
  return t.length > 6 ? `${t.slice(0, 4)}****${t.slice(-2)}` : '****';
}

export default function CredentialDrawer({ person, open, onClose, triggerRef, onSaved }: CredentialDrawerProps) {
  const [phase, setPhase] = useState<Phase>('ready');
  const [password, setPassword] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [replaceConfirmed, setReplaceConfirmed] = useState(false);
  const [showAdminStep, setShowAdminStep] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState('');
  const [handoffUrl, setHandoffUrl] = useState('');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const personId = person?.id;
  // Reset the machine whenever a different person is mounted.
  useEffect(() => {
    setPhase('ready');
    setPassword('');
    setIdempotencyKey('');
    setShowPassword(false);
    setShowReplaceConfirm(false);
    setReplaceConfirmed(false);
    setShowAdminStep(false);
    setAdminPassword('');
    setError('');
    setHandoffUrl('');
    setSavedAt(null);
  }, [personId]);

  useEffect(() => {
    if (person && open) {
      const t = setTimeout(() => closeRef.current?.focus(), 320);
      return () => clearTimeout(t);
    }
  }, [person, open]);

  // Return focus to the launcher when the drawer unmounts.
  useEffect(() => {
    return () => {
      triggerRef?.current?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Escape closes drawer (replacement modal handles its own Escape).
  // Attached on mount (not gated on the animation flag) so an early Escape is never swallowed.
  useEffect(() => {
    if (!person || showReplaceConfirm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [person, showReplaceConfirm, onClose]);

  if (!person) return null;

  const trapTab = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !drawerRef.current) return;
    const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), a[href]',
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const needsClass = person.type === 'student';
  const canGenerate = !!person.username && (!needsClass || !!person.classLabel);
  const canSaveSend = !!person.phone && !!person.username && (!needsClass || !!person.classLabel) && password.length > 0;

  const handleGenerate = () => {
    if (!canGenerate) return;
    try {
      setPassword(generateSecurePassword());
    } catch {
      setError('Secure random generator unavailable in this browser.');
      return;
    }
    setIdempotencyKey(crypto.randomUUID());
    setShowPassword(false);
    setReplaceConfirmed(false);
    setShowAdminStep(false);
    setError('');
    setHandoffUrl('');
    setSavedAt(null);
    setPhase('generated');
  };

  const handleSaveSendClick = () => {
    if (!canSaveSend || phase === 'saving') return;
    setError('');
    if (person.hasExistingPassword && !replaceConfirmed) {
      setShowReplaceConfirm(true);
      return;
    }
    setShowAdminStep(true);
  };

  const buildMessage = (save: { website?: string; schoolName?: string; appUrl?: string }): string => {
    const website = save.website || '';
    const school = save.schoolName || '';
    const appUrl = save.appUrl || '';
    if (person.type === 'teacher') {
      return buildTeacherCredentialMessage({
        school, name: person.name, website,
        username: person.username || person.name, password, appUrl,
      });
    }
    if (person.type === 'staff') {
      return buildStaffCredentialMessage({
        school, name: person.name, designation: person.designation || '',
        website, username: person.username || person.name, password, appUrl,
      });
    }
    return buildStudentCredentialMessage({
      school, name: person.name, className: person.classLabel || '',
      website, username: person.username || '', password, appUrl,
    });
  };

  const doSave = async () => {
    if (!canSaveSend || phase === 'saving') return;
    if (!adminPassword) {
      setError('Enter your admin password to authorize this save.');
      return;
    }
    const popup = window.open('about:blank', '_blank');
    setPhase('saving');
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(person.saveUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          adminPassword,
          replaceExisting: replaceConfirmed,
          idempotencyKey: idempotencyKey || undefined,
          branchId: person.branchId || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        popup?.close();
        if (data.code === 'PASSWORD_REPLACEMENT_REQUIRED') {
          setShowAdminStep(false);
          setAdminPassword('');
          setShowReplaceConfirm(true);
          setPhase('generated');
        } else {
          setError(data.message || 'Save failed. Nothing was changed.');
          setPhase('generated');
        }
        return;
      }
      // Students: the server-resolved parent/guardian number is authoritative.
      const recipient = (person.type === 'student' ? data.data?.recipientPhone : null) || person.phone;
      const url = buildWhatsAppUrl(normalizePhoneDigits(recipient as string), buildMessage(data.data || {}));
      const sentAt: string = data.data?.credentialSentAt || new Date().toISOString();
      const generatedAtOut: string = data.data?.credentialGeneratedAt || sentAt;
      setHandoffUrl(url);
      setSavedAt(sentAt);
      setAdminPassword('');
      onSaved?.(person.id, {
        credentialSentAt: sentAt,
        credentialStatus: 'sent',
        passwordSetAt: sentAt,
        credentialGeneratedAt: generatedAtOut,
      });
      if (popup && !popup.closed) {
        popup.location.href = url;
        setPhase('done');
        showToast('success', 'Credential saved — WhatsApp opened');
      } else {
        setPhase('blocked');
      }
    } catch {
      popup?.close();
      setError('Network error. Nothing was saved — safe to retry.');
      setPhase('generated');
    }
  };

  const closeAll = () => {
    setShowReplaceConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ease-out ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={closeAll}
        aria-hidden="true"
      />
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${TYPE_TITLE[person.type]} for ${person.name}`}
        onKeyDown={trapTab}
        className={`absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l border-warm-card-border bg-[#1a1614] shadow-2xl transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b border-warm-card-border px-5 py-4">
          <h2 className="text-sm font-medium text-warm-cream">{TYPE_TITLE[person.type]}</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={closeAll}
            aria-label="Close credentials drawer"
            className="rounded p-1.5 text-warm-muted hover:bg-warm-card hover:text-warm-cream transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-wide text-warm-muted">
              {person.type === 'student' ? 'Student Name' : person.type === 'teacher' ? 'Teacher Name' : 'Staff Name'}
            </p>
            <p className="text-sm text-warm-cream">{person.name}</p>
          </div>
          {person.type === 'student' && (
            <div>
              <p className="mb-1 text-[11px] uppercase tracking-wide text-warm-muted">Class</p>
              <p className="text-sm text-warm-cream">{person.classLabel || '—'}</p>
            </div>
          )}
          {person.type === 'staff' && (
            <div>
              <p className="mb-1 text-[11px] uppercase tracking-wide text-warm-muted">Designation</p>
              <p className="text-sm text-warm-cream">{person.designation || '—'}</p>
            </div>
          )}
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-wide text-warm-muted">{person.type === 'student' ? 'Guardian WhatsApp' : 'WhatsApp'}</p>
            <p className="text-sm text-warm-cream">{maskPhone(person.phone)}</p>
          </div>
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-wide text-warm-muted">Username</p>
            <p className="font-mono text-sm text-warm-accent">{person.username || '—'}</p>
          </div>
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-wide text-warm-muted">Password</p>
            <div className="flex items-center gap-2">
              <p className="min-h-[1.25rem] flex-1 font-mono text-sm text-warm-cream" aria-live="polite">
                {password ? (showPassword ? password : '••••••••••••') : <span className="text-warm-muted/40">—</span>}
              </p>
              {password && (
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="rounded p-1.5 text-warm-muted hover:bg-warm-card hover:text-warm-cream transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              )}
            </div>
          </div>

          {!canGenerate && (
            <p role="alert" className="rounded-lg border border-yellow-900/40 bg-yellow-900/10 px-3 py-2 text-xs text-yellow-300">
              {person.type === 'student'
                ? 'Username and class are required before generating credentials.'
                : 'A username is required before generating credentials.'}
            </p>
          )}
          {!!person.username && !person.phone && (
            <p role="alert" className="rounded-lg border border-yellow-900/40 bg-yellow-900/10 px-3 py-2 text-xs text-yellow-300">
              {person.type === 'student'
                ? 'A parent/guardian WhatsApp number is required before Save & Send.'
                : 'A WhatsApp/phone number is required before Save & Send.'}
            </p>
          )}
          {error && (
            <p role="alert" className="rounded-lg border border-red-900/40 bg-red-900/10 px-3 py-2 text-xs text-red-300">
              {error}
            </p>
          )}
          {phase === 'done' && (
            <p role="status" className="rounded-lg border border-green-900/40 bg-green-900/10 px-3 py-2 text-xs text-green-300">
              Credential saved{savedAt ? ` (${new Date(savedAt).toLocaleString()})` : ''} — WhatsApp opened with the message prefilled. Press Send inside WhatsApp to deliver it.
            </p>
          )}
          {phase === 'blocked' && (
            <div role="alert" className="rounded-lg border border-yellow-900/40 bg-yellow-900/10 px-3 py-2 text-xs text-yellow-300">
              <p className="mb-2">Credential saved successfully. WhatsApp could not be opened automatically.</p>
              <a
                href={handoffUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors"
              >
                Open WhatsApp
              </a>
            </div>
          )}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate || phase === 'saving'}
            title={!canGenerate ? 'Required identity data is missing.' : 'Generate password'}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-warm-accent/10 px-3 py-2 text-xs text-warm-accent hover:bg-warm-accent/20 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RefreshCw size={13} /> Generate
          </button>

          <button
            type="button"
            onClick={() => {
              if (!canSaveSend || phase === 'saving') return;
              setError('');
              if (person.hasExistingPassword && !replaceConfirmed) {
                setShowReplaceConfirm(true);
                return;
              }
              setShowAdminStep(true);
            }}
            disabled={!canSaveSend || phase === 'saving' || showAdminStep}
            title={!canSaveSend ? 'WhatsApp number, username and a generated password are required.' : 'Save & Send'}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-warm-accent px-3 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          >
            {phase === 'saving' ? 'Saving…' : 'Save & Send'}
          </button>

          {showAdminStep && phase !== 'saving' && (
            <div className="space-y-2 rounded-lg border border-warm-card-border bg-warm-card/30 p-3">
              <label htmlFor="credential-drawer-admin-password" className="text-xs text-warm-muted">
                Enter your admin password to authorize this save.
              </label>
              <input
                id="credential-drawer-admin-password"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') doSave(); }}
                placeholder="Your password"
                autoComplete="current-password"
                className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowAdminStep(false); setAdminPassword(''); }}
                  className="flex-1 rounded-lg border border-warm-card-border px-3 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={doSave}
                  className="flex-1 rounded-lg bg-warm-accent px-3 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors"
                >
                  Confirm Save
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={showReplaceConfirm}
        title="Password already exists"
        message={`This ${person.type} already has a password. Do you want to replace it with the newly generated password?`}
        confirmLabel="Yes, Replace"
        cancelLabel="No, Cancel"
        variant="warning"
        onConfirm={() => {
          setShowReplaceConfirm(false);
          setReplaceConfirmed(true);
          setShowAdminStep(true);
        }}
        onCancel={() => setShowReplaceConfirm(false)}
      />
    </div>
  );
}

/** Big colored launcher button (matches Operations table arrow style). */
export function CredentialDrawerButton({ label, onClick }: { label: string; onClick: (e: React.MouseEvent<HTMLButtonElement>) => void }) {
  // KeyRound reads as credentials/access; distinct from Send/Save/eye icons.
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="rounded-lg bg-warm-accent/15 p-2 text-warm-accent transition-colors hover:bg-warm-accent hover:text-[#1a1614]"
    >
      <KeyRound size={18} strokeWidth={2.5} />
    </button>
  );
}
