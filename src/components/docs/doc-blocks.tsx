import type { ReactNode } from 'react';
import { Info, AlertTriangle, CheckCircle2 } from 'lucide-react';

const styles = {
  info: 'border-warm-accent/30 bg-warm-accent/5 text-warm-cream',
  warn: 'border-amber-500/30 bg-amber-500/5 text-warm-cream',
  tip: 'border-emerald-500/30 bg-emerald-500/5 text-warm-cream',
};

const icons = {
  info: Info,
  warn: AlertTriangle,
  tip: CheckCircle2,
};

export function DocCallout({
  variant = 'info',
  title,
  children,
}: {
  variant?: keyof typeof styles;
  title?: string;
  children: ReactNode;
}) {
  const Icon = icons[variant];
  return (
    <div className={`my-6 rounded-xl border p-4 ${styles[variant]}`}>
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <Icon size={16} className="text-warm-accent" />
        {title}
      </div>
      <div className="text-sm leading-relaxed text-warm-muted">{children}</div>
    </div>
  );
}

export function DocSteps({ children }: { children: ReactNode }) {
  return <ol className="my-6 list-decimal space-y-3 pl-5 text-sm text-warm-muted">{children}</ol>;
}

export function DocStep({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li className="leading-relaxed">
      <strong className="text-warm-cream">{title}</strong>
      <div className="mt-1">{children}</div>
    </li>
  );
}

export function DocTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto">
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
