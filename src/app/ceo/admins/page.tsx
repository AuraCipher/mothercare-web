'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Plus, Users, Mail, MapPin, Check, X, Clock, Copy, ExternalLink,
} from 'lucide-react';
import { showToast } from '@/components/toast';

interface Admin {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  branchId: string;
  branchName: string;
  branchCode: string;
  createdAt: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  branch: { id: string; name: string; code: string };
}

export default function CeoAdminsPage() {
  const router = useRouter();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const d = await api.getInvitations();
      if (d.success) {
        setAdmins(d.data.admins || []);
        setPendingInvitations(d.data.pendingInvitations || []);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCopyLink = async (token: string) => {
    const link = `${window.location.origin}/register-admin?token=${token}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedIndex(token);
      showToast('success', 'Invitation link copied');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      showToast('error', 'Failed to copy link');
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 h-6 w-40 rounded bg-warm-card animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-warm-card animate-pulse" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-xl font-light text-warm-cream">Admins</h1>
          <p className="text-sm text-warm-muted">
            Manage branch administrators and pending invitations.
          </p>
        </div>
        <button
          onClick={() => router.push('/ceo/admins/invite')}
          className="flex items-center gap-1.5 rounded-lg bg-warm-accent px-3.5 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors"
        >
          <Plus size={14} /> Invite New Admin
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-warm-card-border bg-warm-card px-4 py-2 text-xs text-[#b39a76]">{error}</p>
      )}

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-sm font-medium text-warm-cream flex items-center gap-2">
            <Mail size={14} className="text-warm-accent" />
            Pending Invitations
          </h2>
          <div className="space-y-2">
            {pendingInvitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-lg border border-warm-card-border bg-warm-card/50 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Clock size={14} className="text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-warm-cream truncate">{inv.email}</p>
                    <p className="text-xs text-warm-muted">
                      {inv.branch.name} ({inv.branch.code}) · Expires {new Date(inv.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleCopyLink(inv.token)}
                  className="flex items-center gap-1 rounded-lg border border-warm-card-border px-3 py-1.5 text-xs text-warm-muted hover:text-warm-cream hover:border-warm-accent/50 transition-colors shrink-0 ml-3"
                >
                  {copiedIndex === inv.token ? (
                    <><Check size={12} className="text-green-400" /> Copied</>
                  ) : (
                    <><Copy size={12} /> Copy Link</>
                  )}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Existing Admins */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-warm-cream flex items-center gap-2">
          <Users size={14} className="text-warm-accent" />
          Branch Admins
        </h2>

        {admins.length === 0 ? (
          <div className="rounded-xl border border-warm-card-border bg-warm-card p-12 text-center">
            <Users size={32} className="mx-auto mb-3 text-warm-accent/50" />
            <p className="text-sm text-warm-muted">No admins yet.</p>
            <p className="mb-4 text-xs text-warm-muted/60">
              Invite branch administrators to manage school campuses.
            </p>
            <button
              onClick={() => router.push('/ceo/admins/invite')}
              className="text-xs text-warm-accent hover:text-[#b39a76] transition-colors"
            >
              Invite your first admin
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="flex items-center justify-between rounded-xl border border-warm-card-border bg-warm-card p-4 transition-colors hover:bg-warm-card/80"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warm-accent/10 shrink-0">
                    <Users size={15} className="text-warm-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-warm-cream truncate">{admin.name}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-warm-muted">
                      <span>{admin.email}</span>
                      <span className="flex items-center gap-1">
                        <MapPin size={10} className="text-warm-accent" />
                        {admin.branchName}
                      </span>
                      {admin.phone && <span>{admin.phone}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    admin.status === 'active'
                      ? 'bg-green-900/30 text-green-400'
                      : 'bg-gray-700/30 text-gray-400'
                  }`}>
                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                      admin.status === 'active' ? 'bg-green-400' : 'bg-gray-400'
                    }`} />
                    {admin.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
