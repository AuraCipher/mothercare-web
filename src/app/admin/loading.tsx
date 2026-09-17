export default function AdminLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1a1614]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-warm-accent border-t-transparent" />
        <p className="text-sm text-warm-muted">Loading admin panel…</p>
      </div>
    </div>
  );
}
