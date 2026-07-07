'use client';

type NumberStepperProps = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  inputClassName?: string;
  containerClassName?: string;
};

export default function NumberStepper({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  inputClassName = 'h-8 w-16 rounded border border-warm-card-border bg-[#1a1614] px-2 text-center text-xs text-warm-cream',
  containerClassName = 'inline-flex items-center gap-1',
}: NumberStepperProps) {
  const clamp = (n: number) => {
    let next = n;
    if (Number.isFinite(min)) next = Math.max(min, next);
    if (typeof max === 'number' && Number.isFinite(max)) next = Math.min(max, next);
    return next;
  };

  return (
    <div className={containerClassName}>
      <button
        type="button"
        onClick={() => onChange(clamp((Number(value) || 0) - step))}
        className="h-8 w-8 rounded border border-warm-card-border bg-warm-card text-sm font-semibold text-warm-accent hover:bg-warm-accent/10"
      >
        -
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value) || 0))}
        min={min}
        max={max}
        step={step}
        className={inputClassName}
      />
      <button
        type="button"
        onClick={() => onChange(clamp((Number(value) || 0) + step))}
        className="h-8 w-8 rounded border border-warm-card-border bg-warm-card text-sm font-semibold text-warm-accent hover:bg-warm-accent/10"
      >
        +
      </button>
    </div>
  );
}
