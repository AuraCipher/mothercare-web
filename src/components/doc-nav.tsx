'use client';

import { useState } from 'react';
import { FileText, Plus, X, ChevronDown } from 'lucide-react';

export function DocTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="rounded-lg p-1.5 text-warm-muted hover:bg-warm-card hover:text-warm-cream transition-colors"
      title="Documents">
      <FileText size={15} />
    </button>
  );
}

function DocCard({ icon, name, type, progress, showCheck }: { icon: string; name: string; type: string; progress: number; showCheck?: boolean }) {
  const barColor = progress === 100 ? 'bg-green-500' : progress > 80 ? 'bg-warm-accent' : 'bg-warm-accent/80';
  return (
    <div className="rounded-xl border border-warm-card-border bg-warm-card p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-lg shrink-0">{icon}</span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-warm-cream truncate">{name}</p>
            <p className="text-xs text-warm-muted">{type}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {showCheck && <span className="text-green-400 text-xs">✓</span>}
          <span className="text-warm-muted"><ChevronDown size={14} /></span>
        </div>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-warm-card-border/30 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

export default function DocNav() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <button onClick={() => setDrawerOpen(true)}
        className="rounded-lg p-1.5 text-warm-muted hover:bg-warm-card hover:text-warm-cream transition-colors"
        title="Documents">
        <FileText size={15} />
      </button>

      <div className={`fixed inset-0 z-50 transition-all duration-300 ease-out ${drawerOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 ease-out ${drawerOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setDrawerOpen(false)} />
        <div className={`absolute right-0 top-0 h-full w-80 bg-[#24201e] border-l border-warm-card-border shadow-2xl transition-transform duration-300 ease-out ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between border-b border-warm-card-border px-5 py-4">
            <h2 className="text-sm font-medium text-warm-cream">Documents</h2>
            <button onClick={() => setDrawerOpen(false)} className="rounded-lg p-1 text-warm-muted hover:text-warm-cream transition-colors">
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-warm-card-border bg-warm-card/30 py-10 px-6 cursor-pointer hover:border-warm-accent transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warm-accent/10 mb-3">
                <Plus size={20} className="text-warm-accent" />
              </div>
              <p className="text-sm font-medium text-warm-cream">Paste or upload</p>
            </div>

            <p className="text-[10px] font-medium tracking-wider text-warm-muted uppercase">Uploading</p>
            <DocCard icon="🖼️" name="Admission form" type="Picture · JPG" progress={85} />

            <p className="text-[10px] font-medium tracking-wider text-warm-muted uppercase">In Progress</p>
            <DocCard icon="📄" name="Student profile" type="Code · HTML" progress={50} />

            <p className="text-[10px] font-medium tracking-wider text-warm-muted uppercase">Almost Done</p>
            <DocCard icon="📄" name="Student profile" type="Code · HTML" progress={98} />

            <p className="text-[10px] font-medium tracking-wider text-warm-muted uppercase">Uploaded</p>
            <DocCard icon="📄" name="Mothercare school" type="Document · MD" progress={100} showCheck />
          </div>
        </div>
      </div>
    </>
  );
}
