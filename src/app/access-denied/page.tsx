import Link from 'next/link';

export const metadata = {
  title: 'Access Denied',
};

/**
 * M10: landing page for logins that must not enter the Admin Portal UI
 * (e.g. plain management with no branch-admin membership and no module
 * permissions). Separate from /login on purpose: /login auto-routes
 * authenticated users back into /admin, which would loop.
 */
export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1a1614] px-6">
      <div className="w-full max-w-md rounded-2xl border border-warm-card-border bg-warm-card/40 p-8 text-center">
        <h1 className="text-xl font-semibold text-warm-cream">Access denied</h1>
        <p className="mt-3 text-sm text-warm-muted">
          This account does not have access to the Admin Portal. If you are
          school staff, ask your branch administrator to grant you the correct
          role or module permissions. Field staff can continue in the mobile
          app.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg bg-warm-accent px-5 py-2.5 text-sm font-medium text-white"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
