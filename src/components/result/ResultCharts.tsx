'use client';

export type ResultTrendPoint = {
  label: string;
  marksPercent: number;
  secondary?: number;
  secondaryLabel?: string;
};

type ResultLineChartProps = {
  data: ResultTrendPoint[];
  title?: string;
  subtitle?: string;
  height?: number;
  primaryLabel?: string;
  secondaryLabel?: string;
  showSecondary?: boolean;
};

export function ResultLineChart({
  data,
  title,
  subtitle,
  height = 280,
  primaryLabel = 'Marks %',
  secondaryLabel = 'Report rate %',
  showSecondary = true,
}: ResultLineChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center text-xs text-warm-muted/40" style={{ height }}>
        No trend data for current filters
      </div>
    );
  }

  const hasSecondary = showSecondary && data.some((d) => d.secondary != null);
  const maxVal = 100;
  const w = 720;
  const h = height;
  const padL = 48;
  const padR = 16;
  const padT = 24;
  const padB = 36;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  const xAt = (i: number) => padL + (i / Math.max(data.length - 1, 1)) * chartW;
  const yAt = (v: number) => padT + chartH - (Math.min(v, 100) / maxVal) * chartH;

  const marksPoints = data.map((d, i) => `${xAt(i)},${yAt(d.marksPercent)}`).join(' ');
  const secPoints = data.map((d, i) => `${xAt(i)},${yAt(d.secondary ?? 0)}`).join(' ');
  const marksArea = `M ${padL},${padT + chartH} `
    + data.map((d, i) => `L ${xAt(i)},${yAt(d.marksPercent)}`).join(' ')
    + ` L ${padL + chartW},${padT + chartH} Z`;

  const yLabels = [0, 25, 50, 75, 100];
  const labelStep = Math.max(1, Math.floor(data.length / 8));

  return (
    <div>
      {(title || subtitle) && (
        <div className="mb-3">
          {title && <h2 className="text-sm font-medium text-warm-cream">{title}</h2>}
          {subtitle && <p className="mt-0.5 text-[10px] text-warm-muted/50">{subtitle}</p>}
        </div>
      )}
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="resultMarksGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {yLabels.map((v) => {
          const y = yAt(v);
          return (
            <g key={v}>
              <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="#2a2725" strokeWidth="1" strokeDasharray={v === 0 ? '0' : '4,4'} />
              <text x={padL - 6} y={y + 4} textAnchor="end" fill="#666" fontSize="9">{v}%</text>
            </g>
          );
        })}

        <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke="#444" strokeWidth="1" />

        <path d={marksArea} fill="url(#resultMarksGrad)" stroke="none" />
        <polyline fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={marksPoints} />

        {hasSecondary && (
          <polyline fill="none" stroke="#fb923c" strokeWidth="2" strokeLinejoin="round" strokeDasharray="6,4" points={secPoints} opacity="0.9" />
        )}

        {data.map((d, i) => (
          <g key={i}>
            <circle cx={xAt(i)} cy={yAt(d.marksPercent)} r="4" fill="#22d3ee" stroke="#1a1614" strokeWidth="2" />
            <title>{`${d.label}\n${primaryLabel}: ${d.marksPercent}%${d.secondary != null ? `\n${secondaryLabel}: ${Math.round(d.secondary)}%` : ''}`}</title>
          </g>
        ))}

        {data.filter((_, i) => i % labelStep === 0 || i === data.length - 1).map((d) => {
          const i = data.indexOf(d);
          return (
            <text key={`${d.label}-${i}`} x={xAt(i)} y={h - 8} textAnchor="middle" fill="#777" fontSize="9">{d.label}</text>
          );
        })}
      </svg>

      <div className="mt-2 flex flex-wrap gap-4 text-[10px] text-warm-muted/60">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-cyan-400" /> {primaryLabel}
        </span>
        {hasSecondary && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 bg-orange-400 opacity-90" style={{ borderTop: '2px dashed #fb923c' }} /> {secondaryLabel}
          </span>
        )}
      </div>
    </div>
  );
}

const GRADE_COLORS: Record<string, string> = {
  'A+': '#22c55e', A: '#4ade80', 'B+': '#86efac', B: '#a3e635',
  'C+': '#eab308', C: '#facc15', D: '#fb923c', F: '#ef4444',
};

type ResultBarChartProps = {
  data: { label: string; value: number; color?: string }[];
  title?: string;
  subtitle?: string;
  maxHeight?: number;
  valueSuffix?: string;
};

export function ResultBarChart({
  data,
  title,
  subtitle,
  maxHeight = 180,
  valueSuffix = '%',
}: ResultBarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div>
      {title && <h2 className="mb-1 text-sm font-medium text-warm-cream">{title}</h2>}
      {subtitle && <p className="mb-3 text-[10px] text-warm-muted/50">{subtitle}</p>}
      {data.length === 0 ? (
        <p className="py-8 text-center text-xs text-warm-muted/40">No data</p>
      ) : (
        <div className="flex items-end gap-2 overflow-x-auto pb-1" style={{ maxHeight }}>
          {data.map((d, i) => (
            <div key={i} className="flex min-w-[44px] flex-shrink-0 flex-col items-center">
              <span className="mb-1 text-[9px] text-warm-muted/50">{d.value}{valueSuffix}</span>
              <div
                className="w-7 rounded-t transition-all"
                style={{
                  height: `${Math.max(4, Math.round((d.value / max) * (maxHeight - 44)))}px`,
                  background: d.color || '#22d3ee',
                  opacity: 0.85,
                }}
                title={`${d.label}: ${d.value}${valueSuffix}`}
              />
              <span className="mt-1 max-w-[52px] truncate text-center text-[8px] leading-tight text-warm-muted/60">{d.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type ResultGradeBarChartProps = {
  data: { grade: string; count: number }[];
  title?: string;
};

export function ResultGradeBarChart({ data, title }: ResultGradeBarChartProps) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div>
      {title && <h2 className="mb-3 text-sm font-medium text-warm-cream">{title}</h2>}
      {data.length === 0 ? (
        <p className="py-8 text-center text-xs text-warm-muted/40">No grade data</p>
      ) : (
        <div className="flex items-end justify-center gap-3 overflow-x-auto pb-1">
          {data.map((d) => (
            <div key={d.grade} className="flex min-w-[40px] flex-col items-center">
              <span className="mb-1 text-[9px] text-warm-muted/50">{d.count}</span>
              <div
                className="w-8 rounded-t"
                style={{
                  height: `${Math.max(8, Math.round((d.count / max) * 120))}px`,
                  background: GRADE_COLORS[d.grade] || '#b39a76',
                  opacity: 0.9,
                }}
                title={`${d.grade}: ${d.count} students`}
              />
              <span className="mt-1.5 text-[9px] font-medium text-warm-cream">{d.grade}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type ResultHorizontalBarsProps = {
  data: { label: string; pct: number }[];
  title?: string;
  subtitle?: string;
};

export function ResultHorizontalBars({ data, title, subtitle }: ResultHorizontalBarsProps) {
  return (
    <div>
      {title && <h2 className="mb-1 text-sm font-medium text-warm-cream">{title}</h2>}
      {subtitle && <p className="mb-3 text-[10px] text-warm-muted/50">{subtitle}</p>}
      <div className="max-h-64 space-y-2.5 overflow-y-auto pr-1">
        {data.map((d, i) => (
          <div key={i}>
            <div className="mb-1 flex justify-between text-[10px]">
              <span className="truncate pr-2 text-warm-muted">{d.label}</span>
              <span className={`font-medium ${d.pct >= 80 ? 'text-green-400' : d.pct >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{d.pct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-warm-card-border/20">
              <div className="h-full rounded-full bg-cyan-500/70 transition-all" style={{ width: `${Math.min(d.pct, 100)}%` }} />
            </div>
          </div>
        ))}
        {data.length === 0 && <p className="py-4 text-center text-xs text-warm-muted/40">No data</p>}
      </div>
    </div>
  );
}

export function gradeColor(grade: string): string {
  return GRADE_COLORS[grade] || '#b39a76';
}

type PassFailSlice = { label: string; value: number; color: string };

type ResultPassFailChartProps = {
  passed: number;
  failed: number;
  pending?: number;
  title?: string;
  subtitle?: string;
};

export function ResultPassFailChart({ passed, failed, pending = 0, title, subtitle }: ResultPassFailChartProps) {
  const slices: PassFailSlice[] = [
    { label: 'Passed', value: passed, color: '#22c55e' },
    { label: 'Failed', value: failed, color: '#ef4444' },
  ];
  if (pending > 0) slices.push({ label: 'Pending', value: pending, color: '#6b7280' });

  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total === 0) {
    return (
      <div>
        {title && <h2 className="mb-1 text-sm font-medium text-warm-cream">{title}</h2>}
        <p className="py-10 text-center text-xs text-warm-muted/40">No result data — compute results first</p>
      </div>
    );
  }

  let conic = '';
  let deg = 0;
  for (const slice of slices) {
    const sweep = (slice.value / total) * 360;
    conic += `${slice.color} ${deg}deg ${deg + sweep}deg,`;
    deg += sweep;
  }
  conic = conic.slice(0, -1);

  const passRate = Math.round((passed / total) * 1000) / 10;

  return (
    <div>
      {title && <h2 className="mb-1 text-sm font-medium text-warm-cream">{title}</h2>}
      {subtitle && <p className="mb-3 text-[10px] text-warm-muted/50">{subtitle}</p>}
      <div className="flex flex-wrap items-center gap-6">
        <div className="relative mx-auto h-36 w-36 shrink-0">
          <div className="h-full w-full rounded-full" style={{ background: `conic-gradient(${conic})` }} />
          <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-warm-card">
            <span className="text-xl font-light text-green-400">{passRate}%</span>
            <span className="text-[9px] text-warm-muted">pass rate</span>
          </div>
        </div>
        <div className="min-w-[120px] flex-1 space-y-2">
          {slices.map((s) => (
            <div key={s.label} className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-2 text-warm-muted">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
                {s.label}
              </span>
              <span className="text-warm-cream">{s.value}</span>
            </div>
          ))}
          <div className="border-t border-warm-card-border/30 pt-2 text-[10px] text-warm-muted/50">
            Total assessed: {passed + failed}
          </div>
        </div>
      </div>
    </div>
  );
}

export type PassFailTrendPoint = {
  label: string;
  passRate: number;
  avgPercent: number;
  marksPercent?: number;
};

type ResultPassFailTrendChartProps = {
  data: PassFailTrendPoint[];
  title?: string;
  subtitle?: string;
  height?: number;
};

export function ResultPassFailTrendChart({ data, title, subtitle, height = 280 }: ResultPassFailTrendChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center text-xs text-warm-muted/40" style={{ height }}>
        No trend data for current filters
      </div>
    );
  }

  const w = 720;
  const h = height;
  const padL = 48;
  const padR = 16;
  const padT = 24;
  const padB = 36;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;
  const xAt = (i: number) => padL + (i / Math.max(data.length - 1, 1)) * chartW;
  const yAt = (v: number) => padT + chartH - (Math.min(v, 100) / 100) * chartH;

  const passPoints = data.map((d, i) => `${xAt(i)},${yAt(d.passRate)}`).join(' ');
  const avgPoints = data.map((d, i) => `${xAt(i)},${yAt(d.avgPercent)}`).join(' ');
  const labelStep = Math.max(1, Math.floor(data.length / 8));

  return (
    <div>
      {(title || subtitle) && (
        <div className="mb-3">
          {title && <h2 className="text-sm font-medium text-warm-cream">{title}</h2>}
          {subtitle && <p className="mt-0.5 text-[10px] text-warm-muted/50">{subtitle}</p>}
        </div>
      )}
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} preserveAspectRatio="xMidYMid meet">
        {[0, 25, 50, 75, 100].map((v) => {
          const y = yAt(v);
          return (
            <g key={v}>
              <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="#2a2725" strokeWidth="1" strokeDasharray={v === 0 ? '0' : '4,4'} />
              <text x={padL - 6} y={y + 4} textAnchor="end" fill="#666" fontSize="9">{v}%</text>
            </g>
          );
        })}
        <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke="#444" strokeWidth="1" />
        <polyline fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinejoin="round" points={passPoints} />
        <polyline fill="none" stroke="#b39a76" strokeWidth="2" strokeLinejoin="round" strokeDasharray="6,4" points={avgPoints} />
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={xAt(i)} cy={yAt(d.passRate)} r="4" fill="#22c55e" stroke="#1a1614" strokeWidth="2" />
            <title>{`${d.label}\nPass: ${d.passRate}%\nAvg: ${d.avgPercent}%`}</title>
          </g>
        ))}
        {data.filter((_, i) => i % labelStep === 0 || i === data.length - 1).map((d) => {
          const i = data.indexOf(d);
          return (
            <text key={`${d.label}-${i}`} x={xAt(i)} y={h - 8} textAnchor="middle" fill="#777" fontSize="9">{d.label}</text>
          );
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-4 text-[10px] text-warm-muted/60">
        <span className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-4 bg-green-500" /> Pass rate</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-4 bg-warm-accent opacity-70" style={{ borderTop: '2px dashed #b39a76' }} /> Avg %</span>
      </div>
    </div>
  );
}

type ResultStackedPassFailProps = {
  data: { label: string; passed: number; failed: number }[];
  title?: string;
  subtitle?: string;
};

export function ResultStackedPassFailChart({ data, title, subtitle }: ResultStackedPassFailProps) {
  const max = Math.max(...data.map((d) => d.passed + d.failed), 1);
  return (
    <div>
      {title && <h2 className="mb-1 text-sm font-medium text-warm-cream">{title}</h2>}
      {subtitle && <p className="mb-3 text-[10px] text-warm-muted/50">{subtitle}</p>}
      {data.length === 0 ? (
        <p className="py-8 text-center text-xs text-warm-muted/40">No data</p>
      ) : (
        <div className="flex items-end gap-2 overflow-x-auto pb-1">
          {data.map((d, i) => {
            const total = d.passed + d.failed;
            const passH = Math.round((d.passed / max) * 120);
            const failH = Math.round((d.failed / max) * 120);
            return (
              <div key={i} className="flex min-w-[48px] flex-shrink-0 flex-col items-center">
                <span className="mb-1 text-[9px] text-warm-muted/50">{total}</span>
                <div className="flex h-28 w-8 flex-col justify-end overflow-hidden rounded-t">
                  <div className="w-full bg-red-500/80" style={{ height: `${failH}px` }} title={`Failed: ${d.failed}`} />
                  <div className="w-full bg-green-500/80" style={{ height: `${passH}px` }} title={`Passed: ${d.passed}`} />
                </div>
                <span className="mt-1 max-w-[56px] truncate text-center text-[8px] text-warm-muted/60">{d.label}</span>
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-2 flex gap-4 text-[10px] text-warm-muted/50">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-green-500/80" /> Pass</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-red-500/80" /> Fail</span>
      </div>
    </div>
  );
}
