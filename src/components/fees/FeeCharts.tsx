'use client';

export type LineTrendPoint = {
  label: string;
  due: number;
  collected: number;
  rate: number;
  paymentCount?: number;
};

type FeeLineChartProps = {
  data: LineTrendPoint[];
  title?: string;
  subtitle?: string;
  height?: number;
  showRate?: boolean;
};

function formatShortAmount(paise: number): string {
  const pkr = paise / 100;
  if (pkr >= 1000000) return `${(pkr / 1000000).toFixed(1)}M`;
  if (pkr >= 1000) return `${(pkr / 1000).toFixed(0)}k`;
  return String(Math.round(pkr));
}

export function FeeLineChart({ data, title, subtitle, height = 280, showRate = true }: FeeLineChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center text-xs text-warm-muted/40" style={{ height }}>
        No trend data for this period
      </div>
    );
  }

  const maxVal = Math.max(...data.flatMap(d => [d.due, d.collected, 1]));
  const w = 720;
  const h = height;
  const padL = 58;
  const padR = showRate ? 48 : 16;
  const padT = 24;
  const padB = 36;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  const xAt = (i: number) => padL + (i / Math.max(data.length - 1, 1)) * chartW;
  const yAt = (v: number) => padT + chartH - (v / maxVal) * chartH;
  const yRate = (r: number) => padT + chartH - (r / 100) * chartH;

  const duePoints = data.map((d, i) => `${xAt(i)},${yAt(d.due)}`).join(' ');
  const colPoints = data.map((d, i) => `${xAt(i)},${yAt(d.collected)}`).join(' ');
  const ratePoints = data.map((d, i) => `${xAt(i)},${yRate(d.rate)}`).join(' ');
  const colArea = `M ${padL},${padT + chartH} ` + data.map((d, i) => `L ${xAt(i)},${yAt(d.collected)}`).join(' ') + ` L ${padL + chartW},${padT + chartH} Z`;

  const gridSteps = 5;
  const yLabels = Array.from({ length: gridSteps + 1 }, (_, i) => Math.round((maxVal / gridSteps) * i));

  const labelStep = Math.max(1, Math.floor(data.length / 10));

  return (
    <div>
      {(title || subtitle) && (
        <div className="mb-3">
          {title && <h2 className="text-sm font-medium text-warm-cream">{title}</h2>}
          {subtitle && <p className="text-[10px] text-warm-muted/50 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="feeColGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {yLabels.map((v, i) => {
          const y = yAt(v);
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="#2a2725" strokeWidth="1" strokeDasharray={i === 0 ? '0' : '4,4'} />
              <text x={padL - 6} y={y + 4} textAnchor="end" fill="#666" fontSize="9">{formatShortAmount(v)}</text>
            </g>
          );
        })}

        {showRate && [0, 25, 50, 75, 100].map(r => (
          <text key={r} x={w - 8} y={yRate(r) + 3} textAnchor="end" fill="#555" fontSize="8">{r}%</text>
        ))}

        <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke="#444" strokeWidth="1" />

        <path d={colArea} fill="url(#feeColGrad)" stroke="none" />

        <polyline fill="none" stroke="#888" strokeWidth="2" strokeDasharray="6,4" strokeLinejoin="round" points={duePoints} />
        <polyline fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={colPoints} />

        {showRate && (
          <polyline fill="none" stroke="#b39a76" strokeWidth="1.5" strokeLinejoin="round" strokeDasharray="3,3" points={ratePoints} opacity="0.8" />
        )}

        {data.map((d, i) => (
          <g key={i}>
            <circle cx={xAt(i)} cy={yAt(d.collected)} r="4" fill="#22c55e" stroke="#1a1614" strokeWidth="2" />
            <title>{`${d.label}\nDue: ${(d.due / 100).toLocaleString()} PKR\nCollected: ${(d.collected / 100).toLocaleString()} PKR\nRate: ${d.rate}%`}</title>
          </g>
        ))}

        {data.filter((_, i) => i % labelStep === 0 || i === data.length - 1).map((d) => {
          const i = data.indexOf(d);
          return (
            <text key={d.label + i} x={xAt(i)} y={h - 8} textAnchor="middle" fill="#777" fontSize="9">{d.label}</text>
          );
        })}
      </svg>

      <div className="flex flex-wrap gap-4 mt-2 text-[10px] text-warm-muted/60">
        <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-[#888] inline-block" style={{ borderTop: '2px dashed #888' }} /> Due</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-green-500 inline-block" /> Collected</span>
        {showRate && <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-warm-accent inline-block opacity-70" style={{ borderTop: '1px dashed #b39a76' }} /> Rate %</span>}
      </div>
    </div>
  );
}

type FeeBarChartProps = {
  data: { label: string; value: number; color?: string }[];
  title?: string;
  maxHeight?: number;
};

export function FeeBarChart({ data, title, maxHeight = 160 }: FeeBarChartProps) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div>
      {title && <h2 className="text-sm font-medium text-warm-cream mb-3">{title}</h2>}
      <div className="flex items-end gap-2 overflow-x-auto pb-1" style={{ maxHeight }}>
        {data.map((d, i) => (
          <div key={i} className="flex flex-col items-center min-w-[44px] flex-shrink-0">
            <span className="text-[9px] text-warm-muted/50 mb-1">{formatShortAmount(d.value)}</span>
            <div className="w-7 rounded-t transition-all" style={{
              height: `${Math.max(4, Math.round((d.value / max) * (maxHeight - 40)))}px`,
              background: d.color || '#22c55e',
              opacity: 0.85,
            }} title={`${d.label}: ${(d.value / 100).toLocaleString()} PKR`} />
            <span className="text-[8px] text-warm-muted/60 mt-1 text-center leading-tight max-w-[52px] truncate">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type FeeHorizontalBarsProps = {
  data: { label: string; value: number; max: number; pct: number }[];
  title?: string;
};

export function FeeHorizontalBars({ data, title }: FeeHorizontalBarsProps) {
  return (
    <div>
      {title && <h2 className="text-sm font-medium text-warm-cream mb-3">{title}</h2>}
      <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
        {data.map((d, i) => (
          <div key={i}>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-warm-muted truncate pr-2">{d.label}</span>
              <span className={`font-medium ${d.pct >= 80 ? 'text-green-400' : d.pct >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{d.pct}%</span>
            </div>
            <div className="h-1.5 bg-warm-card-border/20 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-warm-accent/70 transition-all" style={{ width: `${Math.min(d.pct, 100)}%` }} />
            </div>
          </div>
        ))}
        {data.length === 0 && <p className="text-xs text-warm-muted/40 text-center py-4">No data</p>}
      </div>
    </div>
  );
}
