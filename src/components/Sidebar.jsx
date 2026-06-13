import { useState, useRef } from 'react';
import {
  LayoutDashboard, Mic, Bot, Video, Workflow,
  BarChart2, Settings, ChevronRight, Zap, Sparkles, BookOpen
} from 'lucide-react';
import { useApp } from '../lib/store';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'xi-voices', label: 'Voices', icon: Mic },
  { id: 'xi-agents', label: 'Agents', icon: Bot },
  { id: 'xi-reports', label: 'Conversations', icon: BarChart2 },
  { id: 'live-avatars', label: 'Avatars', icon: Video },
  { id: 'divider6', divider: true, label: 'KNOWLEDGE BASE' },
  { id: 'xi-knowledge', label: 'Knowledge Base', icon: BookOpen },
  { id: 'n8n', label: 'Workflows', icon: Workflow },
  { id: 'divider5', divider: true, label: 'TESTING' },
  { id: 'preview-demo', label: 'Preview & Demo', icon: Sparkles },
  { id: 'divider4', divider: true, label: 'SYSTEM' },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { activePage, setActivePage } = useApp();
  const [expanded, setExpanded] = useState(false);
  const collapsed = !expanded;
  const collapseTimer = useRef(null);

  function handleMouseEnter() {
    clearTimeout(collapseTimer.current);
    setExpanded(true);
  }

  function handleMouseLeave() {
    collapseTimer.current = setTimeout(() => setExpanded(false), 500);
  }

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`sidebar-desktop flex flex-col h-screen flex-shrink-0 glass transition-all duration-200 ${collapsed ? 'w-16' : 'w-64'}`}
      style={{ borderRight: '1px solid rgba(0,198,255,0.08)' }}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 py-5 ${collapsed ? 'px-3 justify-center' : 'px-6'}`} style={{ borderBottom: '1px solid rgba(0,198,255,0.08)' }}>
        <div className="w-8 h-8 accent-gradient rounded-lg flex items-center justify-center pulse-glow flex-shrink-0">
          <Zap size={16} className="text-white" />
        </div>
        {!collapsed && <span className="text-xl font-bold tracking-tight accent-text">ELLUX</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {NAV.map((item) => {
          if (item.divider) {
            if (collapsed) {
              return <div key={item.id} className="my-3 mx-2 h-px" style={{ background: 'rgba(0,198,255,0.08)' }} />;
            }
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
              title={collapsed ? item.label : undefined}
              className={`sidebar-item w-full flex items-center rounded-lg mb-0.5 text-sm font-medium ${
                collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'
              } ${active ? 'active text-cyan-300' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
            >
              <Icon size={collapsed ? 18 : 16} className={active ? 'text-cyan-400' : 'text-slate-500'} />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && active && <ChevronRight size={14} className="ml-auto text-cyan-500" />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(0,198,255,0.08)' }}>
          <p className="text-xs text-slate-600">Ellux Platform v1.0</p>
        </div>
      )}
    </aside>
  );
}
