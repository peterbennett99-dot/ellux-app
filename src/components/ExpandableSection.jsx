import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function ExpandableSection({ title, subtitle, icon: Icon, color = '#00c6ff', defaultOpen = false, badge, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-5 py-4 flex items-center justify-between text-left"
        style={{ background: `${color}0a` }}
      >
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}1a` }}>
              <Icon size={16} style={{ color }} />
            </div>
          )}
          <div>
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {badge}
          <ChevronDown size={16} className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {open && (
        <div className="p-5 space-y-4" style={{ borderTop: '1px solid rgba(0,198,255,0.08)' }}>
          {children}
        </div>
      )}
    </div>
  );
}
