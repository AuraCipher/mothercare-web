'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  ArrowLeft, Mail, MapPin, Check, Copy, X,
} from 'lucide-react';
import { showToast } from '@/components/toast';

interface Branch {
  id: string; name: string; code: string;
}

export default function InviteAdminPage() {
  const router = useRouter();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [email, setEmail] = useState('');
  const [branchId, setBranchId] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  // Result state
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<boolean | null>(null);
  const [emailWarning, setEmailWarning] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.getBranches().then(d => {
      if (d.success) setBranches(d.data || []);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!branchId) {
      setError('Please select a branch');
      return;
    }

    setSending(true);
    try {
      const d = await api.createInvitation(email.trim(), branchId);
      if (d.success && d.data?.link) {
        setInviteLink(d.data.link);
        setEmailSent(d.data.emailSent ?? false);
        setEmailWarning(d.data.emailWarning ?? null);
        showToast('success', d.data.message || 'Invitation created');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to create invitation');
    } finally {
      setSending(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      showToast('success', 'Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('error', 'Failed to copy');
    }
  };

  const handleReset = () => {
    setInviteLink(null);
    setEmailSent(null);
    setEmailWarning(null);
    setEmail('');
    setBranchId('');
    setError('');
    setCopied(false);
  };

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      {/* Back link */}
      <button
        onClick={() => router.push('/ceo/admins')}
        className="mb-6 flex items-center gap-1.5 text-xs text-warm-muted hover:text-warm-cream transition-colors"
      >
        <ArrowLeft size={14} /> Back to Admins
      </button>

      <div className="mb-8">
        <h1 className="mb-1 text-xl font-light text-warm-cream">Invite New Admin</h1>
        <p className="text-sm text-warm-muted">
          Send an invitation email to create a branch administrator account.
          When Resend is configured, the invite is emailed automatically; you can still copy the link as a backup.
        </p>
      </div>

      {!inviteLink ? (
        /* ── Invitation Form ─────────────────────────────── */
        <form onSubmit={handleSubmit} className="rounded-xl border border-warm-card-border bg-warm-card p-6">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs text-warm-muted">Email Address *</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. newadmin@mothercare.edu"
                  className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] pl-9 pr-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-warm-muted">Assign Branch *</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-muted pointer-events-none" />
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] pl-9 pr-3 py-2 text-sm text-warm-cream outline-none focus:border-warm-accent transition-colors appearance-none"
                >
                  <option value="">Select a branch…</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-lg border border-warm-card-border bg-[#1a1614] px-4 py-3">
              <p className="text-xs text-warm-muted">
                <span className="font-medium text-warm-cream">What happens next?</span><br />
                An invitation link is generated and emailed to the address above when Resend is configured.
                They will set their own password. The link expires in 7 days — copy it below if email delivery is unavailable.
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-3 rounded-lg border border-red-900/30 bg-red-900/10 px-3 py-2">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => router.push('/ceo/admins')}
              className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50 transition-colors"
            >
              {sending ? 'Sending…' : 'Send Invitation'}
            </button>
          </div>
        </form>
      ) : (
        /* ── Link Generated ─────────────────────────────── */
        <div className="rounded-xl border border-warm-card-border bg-warm-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-900/30">
              <Check size={16} className="text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-warm-cream">Invitation Created</p>
              <p className="text-xs text-warm-muted">
                {emailSent
                  ? 'An email was sent to the invitee. You can still copy the link below as a backup.'
                  : 'Share this link with the new admin (email was not sent automatically).'}
              </p>
            </div>
          </div>

          {emailWarning && (
            <div className="mb-4 rounded-lg border border-amber-900/30 bg-amber-900/10 px-4 py-3">
              <p className="text-xs text-amber-300">{emailWarning}</p>
            </div>
          )}

          {emailSent && (
            <div className="mb-4 rounded-lg border border-green-900/30 bg-green-900/10 px-4 py-3">
              <p className="text-xs text-green-300">Invitation email delivered via Resend.</p>
            </div>
          )}

          {/* Invited email + branch info */}
          <div className="mb-4 rounded-lg border border-warm-card-border bg-[#1a1614] px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-warm-muted">
              <Mail size={13} className="text-warm-accent shrink-0" />
              <span className="text-warm-cream">{email}</span>
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-xs text-warm-muted">
              <MapPin size={13} className="text-warm-accent shrink-0" />
              <span>{branches.find(b => b.id === branchId)?.name || 'Unknown'} ({branches.find(b => b.id === branchId)?.code || ''})</span>
            </div>
          </div>

          <div className="relative">
            <div className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] px-4 py-3 text-sm text-warm-cream break-all select-all pr-12">
              {inviteLink}
            </div>
            <button
              onClick={handleCopy}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-warm-muted hover:text-warm-cream hover:bg-warm-card transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check size={15} className="text-green-400" /> : <Copy size={15} />}
            </button>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={handleReset}
              className="rounded-lg border border-warm-card-border px-4 py-2 text-xs text-warm-muted hover:text-warm-cream transition-colors"
            >
              Invite Another
            </button>
            <button
              onClick={() => router.push('/ceo/admins')}
              className="rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors"
            >
              Back to Admins
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
