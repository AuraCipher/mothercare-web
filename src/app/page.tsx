import config from '@/config';

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="flex flex-col items-center gap-6 max-w-md text-center">
        {/* Logo mark */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
          <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="white" strokeWidth={2}>
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold tracking-tight">{config.appName}</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          School broadcasting &amp; communication platform. Built for privacy, role-based access, and seamless
          parent-teacher connection.
        </p>

        <div className="flex gap-3 mt-2">
          <a
            href="/login"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors"
          >
            Sign In
          </a>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          {config.appMode === 'development' ? 'Development Mode' : 'Production'}
          {' · '}API: {config.apiUrl}
        </p>
      </div>
    </main>
  );
}
