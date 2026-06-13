import { useState, useEffect } from 'react';
import { Mic, Bot, Video, Workflow, TrendingUp, Clock, Activity, Zap, Sparkles } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { elevenLabs } from '../lib/api';
import { useApp } from '../lib/store';

const mockConvData = [
  { day: 'Mon', conversations: 12 },
  { day: 'Tue', conversations: 18 },
  { day: 'Wed', conversations: 14 },
  { day: 'Thu', conversations: 25 },
  { day: 'Fri', conversations: 22 },
  { day: 'Sat', conversations: 9 },
  { day: 'Sun', conversations: 16 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass px-3 py-2 rounded-lg text-xs">
        <p className="text-slate-400">{label}</p>
        <p className="text-cyan-400 font-semibold">{payload[0].value} conversations</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { setActivePage } = useApp();
  const [stats, setStats] = useState({ voices: 0, agents: 0, conversations: 0 });

  useEffect(() => {
    const xiKey = localStorage.getItem('xi_api_key');
    if (!xiKey) return;
    Promise.allSettled([
      elevenLabs.getVoices(),
      elevenLabs.getAgents(),
      elevenLabs.getConversations(),
    ]).then(([v, a, c]) => {
      setStats({
        voices: v.status === 'fulfilled' ? (v.value.voices?.length ?? 0) : 0,
        agents: a.status === 'fulfilled' ? (a.value.agents?.length ?? 0) : 0,
        conversations: c.status === 'fulfilled' ? (c.value.conversations?.length ?? 0) : 0,
      });
    });
  }, []);

  const cards = [
    { label: 'Voices', value: stats.voices || '—', icon: Mic, color: '#00c6ff', page: 'xi-voices' },
    { label: 'Agents', value: stats.agents || '—', icon: Bot, color: '#7c3aed', page: 'xi-agents' },
    { label: 'Conversations', value: stats.conversations || '—', icon: Activity, color: '#10b981', page: 'xi-reports' },
    { label: 'Workflows', value: 'N8N', icon: Workflow, color: '#f59e0b', page: 'n8n' },
  ];

  const quickActions = [
    { label: 'Configure Voices', icon: Mic, page: 'xi-voices', desc: 'ElevenLabs voice settings' },
    { label: 'Manage Agents', icon: Bot, page: 'xi-agents', desc: 'AI agent configurations' },
    { label: 'Live Avatars', icon: Video, page: 'live-avatars', desc: 'LiveAvatar sessions' },
    { label: 'Run Workflow', icon: Zap, page: 'n8n', desc: 'Trigger N8N automations' },
    { label: 'Preview & Demo', icon: Sparkles, page: 'preview-demo', desc: 'End-to-end live test' },
  ];

  return (
    <div className="fade-in p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Ellux unified control panel</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color, page }) => (
          <button
            key={label}
            onClick={() => setActivePage(page)}
            className="glass-card rounded-xl p-4 text-left"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
              style={{ background: `${color}22` }}
            >
              <Icon size={16} style={{ color }} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <TrendingUp size={16} className="text-cyan-400" />
            Conversation Volume (7 days)
          </h2>
          <span className="badge badge-blue">Live</span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={mockConvData}>
            <defs>
              <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00c6ff" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#00c6ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="conversations" stroke="#00c6ff" strokeWidth={2} fill="url(#cg)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
          <Clock size={14} />
          QUICK ACTIONS
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map(({ label, icon: Icon, page, desc }) => (
            <button
              key={label}
              onClick={() => setActivePage(page)}
              className="glass-card rounded-xl p-4 text-left flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,198,255,0.1)' }}>
                <Icon size={15} className="text-cyan-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
