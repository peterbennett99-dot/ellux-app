import { LayoutDashboard, Mic, Bot, Video, Workflow, BarChart2, Settings, Sparkles, BookOpen, Code2 } from 'lucide-react';
import { useApp } from '../lib/store';

const NAV = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'xi-voices', label: 'Voices', icon: Mic },
  { id: 'xi-agents', label: 'Agents', icon: Bot },
  { id: 'live-avatars', label: 'Avatars', icon: Video },
  { id: 'xi-knowledge', label: 'Knowledge', icon: BookOpen },
  { id: 'n8n', label: 'Workflows', icon: Workflow },
  { id: 'preview-demo', label: 'Demo', icon: Sparkles },
  { id: 'embed-widget', label: 'Embed', icon: Code2 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function MobileNav() {
  const { activePage, setActivePage } = useApp();

  return (
    <nav
      className="mobile-nav fixed bottom-0 left-0 right-0 z-40 glass"
      style={{ borderTop: '1px solid rgba(0,198,255,0.12)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around px-1 py-2">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = activePage === id;
          return (
            <button
              key={id}
              onClick={() => setActivePage(id)}
              className="flex flex-col items-center gap-1 px-1 py-1 rounded-lg"
            >
              <Icon
                size={18}
                className={active ? 'text-cyan-400' : 'text-slate-500'}
              />
              <span className={`text-[9px] font-medium ${active ? 'text-cyan-400' : 'text-slate-500'}`}>
                {label}
              </span>
              {active && (
                <div className="w-1 h-1 rounded-full" style={{ background: '#00c6ff' }} />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
