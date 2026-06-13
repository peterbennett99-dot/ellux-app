import {
  LayoutDashboard, Mic, Bot, Video, Workflow,
  BarChart2, Settings, ChevronRight, Zap, Sparkles
} from 'lucide-react';
import { useApp } from '../lib/store';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'divider1', divider: true, label: 'ELEVENLABS' },
  { id: 'xi-voices', label: 'Voices', icon: Mic },
  { id: 'xi-agents', label: 'Agents', icon: Bot },
  { id: 'xi-reports', label: 'Conversations', icon: BarChart2 },
  { id: 'divider2', divider: true, label: 'LIVEAVATAR' },
  { id: 'live-avatars', label: 'Live Avatars', icon: Video },
  { id: 'divider3', divider: true, label: 'AUTOMATION' },
  { id: 'n8n', label: 'N8N Workflows', icon: Workflow },
  { id: 'divider5', divider: true, label: 'TESTING' },
  { id: 'preview-demo', label: 'Preview & Demo', icon: Sparkles },
  { id: 'divider4', divider: true, label: 'SYSTEM' },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { activePage, setActivePage } = useApp();

  return (
    <aside
      className="sidebar-desktop flex flex-col h-screen w-64 flex-shrink-0 glass"
      style={{ borderRight: '1px solid rgba(0,198,255,0.08)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5" style={{ borderBottom: '1px solid rgba(0,198,255,0.08)' }}>
        <div className="w-8 h-8 accent-gradient rounded-lg flex items-center justify-center pulse-glow">
          <Zap size={16} className="text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight accent-text">ELLUX</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {NAV.map((item) => {
          if (item.divider) {
            return (
              <div key={item.id} className="px-3 pt-5 pb-2">
                <span className="text-xs font-semibold tracking-widest" style={{ color: 'rgba(0,198,255,0.4)' }}>
                  {item.label}
                </span>
              </div>
            );
          }
          const Icon = item.icon;
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`sidebar-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium ${
                active ? 'active text-cyan-300' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Icon size={16} className={active ? 'text-cyan-400' : 'text-slate-500'} />
              <span>{item.label}</span>
              {active && <ChevronRight size={14} className="ml-auto text-cyan-500" />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(0,198,255,0.08)' }}>
        <p className="text-xs text-slate-600">Ellux Platform v1.0</p>
      </div>
    </aside>
  );
}
