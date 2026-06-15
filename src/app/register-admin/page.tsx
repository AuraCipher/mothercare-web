'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Check, X, Eye, EyeOff, Mail, MapPin, User, Lock, Phone,
} from 'lucide-react';
import { showToast } from '@/components/toast';

function RegisterAdminInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [validating, setValidating] = useState(true);
  const [email, setEmail] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [branchId, setBranchId] = useState('');
  const [error, setError] = useState('');
  const [invalid, setInvalid] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Missing invitation token');
      setInvalid(true);
      setValidating(false);
      return;
    }

    api.validateInvitation(token)
      .then((d) => {
        if (d.success && d.data) {
          setEmail(d.data.email);
          setBranchName(d.data.branchName);
          setBranchCode(d.data.branchCode);
          setBranchId(d.data.branchId);
          setValidating(false);
        } else {
          setError('Invalid invitation');
          setInvalid(true);
          setValidating(false);
        }
      })
      .catch((e) => {
        setError(e.message || 'Invalid or expired invitation link');
        setInvalid(true);
        setValidating(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Name is required');
      return;
    }
    if (!username.trim()) {
      setFormError('Username is required');
      return;
    }
    if (!password) {
      setFormError('Password is required');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const d = await api.completeInvitation(token!, {
        name: name.trim(),
        username: username.trim(),
        password,
        phone: phone.trim() || undefined,
      });
      if (d.success) {
        setSuccess(true);
        showToast('success', 'Account created successfully');
      }
    } catch (e: any) {
      setFormError(e.message || 'Failed to create account');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading state ─────────────────────────────────
  if (validating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a1614]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-warm-accent border-t-transparent" />
          <p className="text-sm text-warm-muted">Validating invitation…</p>
        </div>
      </div>
    );
  }

  // ── Invalid / Expired state ───────────────────────
  if (invalid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a1614]">
        <div className="w-full max-w-md rounded-xl border border-warm-card-border bg-warm-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-900/30">
            <X size={24} className="text-red-400" />
          </div>
          <h1 className="mb-2 text-lg font-medium text-warm-cream">Invalid Invitation</h1>
          <p className="mb-6 text-sm text-warm-muted">{error}</p>
          <p className="mb-6 text-xs text-warm-muted/60">
            This invitation link may be expired or already used.
            Please contact your CEO to request a new one.
          </p>
          <a
            href="/login"
            className="inline-block rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  // ── Success state ─────────────────────────────────
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a1614]">
        <div className="w-full max-w-md rounded-xl border border-warm-card-border bg-warm-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-900/30">
            <Check size={24} className="text-green-400" />
          </div>
          <h1 className="mb-2 text-lg font-medium text-warm-cream">Account Created!</h1>
          <p className="mb-2 text-sm text-warm-muted">
            Your admin account has been set up successfully.
          </p>
          <p className="mb-6 text-xs text-warm-muted/60">
            You can now log in with your email and password.
          </p>
          <a
            href="/login"
            className="inline-block rounded-lg bg-warm-accent px-4 py-2 text-xs font-medium text-[#1a1614] hover:bg-[#b39a76] transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  // ── Registration form ─────────────────────────────
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1a1614] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-light text-warm-cream">Complete Registration</h1>
          <p className="mt-1 text-sm text-warm-muted">Set up your admin account to get started.</p>
        </div>

        {/* Invitation info */}
        <div className="mb-6 rounded-lg border border-warm-card-border bg-warm-card/50 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-warm-muted">
            <Mail size={13} className="text-warm-accent shrink-0" />
            <span className="text-warm-cream">{email}</span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-warm-muted">
            <MapPin size={13} className="text-warm-accent shrink-0" />
            <span>{branchName} ({branchCode})</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-warm-card-border bg-warm-card p-6">
          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="mb-1 block text-xs text-warm-muted">Full Name *</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-muted" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Admin"
                  className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] pl-9 pr-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="mb-1 block text-xs text-warm-muted">Username *</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-muted" />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. john.admin"
                  className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] pl-9 pr-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors"
                />
              </div>
            </div>

            {/* Email (readonly) */}
            <div>
              <label className="mb-1 block text-xs text-warm-muted">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-muted" />
                <input
                  value={email}
                  readOnly
                  className="w-full rounded-lg border border-warm-card-border bg-[#1a1614]/50 pl-9 pr-3 py-2 text-sm text-warm-muted cursor-not-allowed"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-1 block text-xs text-warm-muted">Password *</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] pl-9 pr-9 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-muted hover:text-warm-cream transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="mb-1 block text-xs text-warm-muted">Confirm Password *</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] pl-9 pr-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1 block text-xs text-warm-muted">Phone Number</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-muted" />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +92 300 1234567"
                  className="w-full rounded-lg border border-warm-card-border bg-[#1a1614] pl-9 pr-3 py-2 text-sm text-warm-cream outline-none placeholder:text-warm-muted/40 focus:border-warm-accent transition-colors"
                />
              </div>
            </div>
          </div>

          {formError && (
            <div className="mt-3 rounded-lg border border-red-900/30 bg-red-900/10 px-3 py-2">
              <p className="text-xs text-red-400">{formError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-5 w-full rounded-lg bg-warm-accent px-4 py-2.5 text-sm font-medium text-[#1a1614] hover:bg-[#b39a76] disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Creating Account…' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
export default function RegisterAdminPage() { return <Suspense><RegisterAdminInner /></Suspense>; }
