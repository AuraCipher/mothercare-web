'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

let toastId = 0;
const listeners: Set<(t: ToastItem) => void> = new Set();

export function showToast(type: ToastType, message: string) {
  const item: ToastItem = { id: ++toastId, type, message };
  listeners.forEach((fn) => fn(item));
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (t: ToastItem) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, 4000);
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  const remove = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[70] flex flex-col gap-2">
      {toasts.map((t) => {
        const icon =
          t.type === 'success' ? <CheckCircle size={14} className="text-green-400" /> :
          t.type === 'error' ? <AlertTriangle size={14} className="text-red-400" /> :
          <Info size={14} className="text-warm-accent" />;

        const borderColor =
          t.type === 'success' ? 'border-green-900/30' :
          t.type === 'error' ? 'border-red-900/30' :
          'border-warm-accent/30';

        return (
          <div
            key={t.id}
            className={`flex items-center gap-2.5 rounded-lg border bg-[#2a2522] px-4 py-3 shadow-lg ${borderColor} animate-in slide-in-from-right-10 fade-in`}
          >
            {icon}
            <span className="text-xs text-warm-cream">{t.message}</span>
            <button onClick={() => remove(t.id)} className="ml-2 text-warm-muted hover:text-warm-cream transition-colors">
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
