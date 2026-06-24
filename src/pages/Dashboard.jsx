import { useState, useEffect, useRef } from 'react';
import {
  Mic, Bot, Workflow, TrendingUp, Activity, CheckCircle2, XCircle, MessageSquare,
  RefreshCw, Clock, User, ChevronDown, ChevronUp, HelpCircle, BarChart2,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
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

function duration(secs) {
  if (!secs) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function ConvCard({ conv }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioError, setAudioError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useApp();

  useEffect(() => {
    return () => { if (audioUrl) URL.revokeObjectURL(audioUrl); };
  }, [audioUrl]);

  async function loadDetail() {
    if (detail) { setOpen(o => !o); return; }
    setLoading(true);
    try {
      const d = await elevenLabs.getConversation(conv.conversation_id);
      setDetail(d);
      setOpen(true);
      elevenLabs.getConversationAudioUrl(conv.conversation_id)
        .then(setAudioUrl)
        .catch(e => setAudioError(e.message));
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  const status = conv.status || 'done';
  const badgeCls = status === 'processing' ? 'badge-amber' : status === 'error' ? 'badge-red' : 'badge-green';

  const callSuccess = conv.call_successful || conv.analysis?.call_successful;
  const resultBadge = callSuccess === 'success'
    ? <span className="badge badge-green"><CheckCircle2 size={10} /> Passed</span>
    : callSuccess === 'failure'
      ? <span className="badge badge-red"><XCircle size={10} /> Failed</span>
      : <span className="badge badge-blue"><HelpCircle size={10} /> Unevaluated</span>;

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <button onClick={loadDetail} className="w-full flex items-center gap-3 p-4 text-left">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16,185,129,0.12)' }}>
          <MessageSquare size={14} className="text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono text-slate-400 truncate">{conv.conversation_id}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`badge ${badgeCls}`}>{status}</span>
            {resultBadge}
            {(conv.start_time_unix_secs ?? conv.metadata?.start_time_unix_secs) && (
              <span className="text-xs text-slate-500">
                {new Date((conv.start_time_unix_secs ?? conv.metadata.start_time_unix_secs) * 1000).toLocaleDateString()}
              </span>
            )}
            {(conv.call_duration_secs ?? conv.metadata?.call_duration_secs) !== undefined && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock size={10} />
                {duration(conv.call_duration_secs ?? conv.metadata.call_duration_secs)}
              </span>
            )}
          </div>
        </div>
        {loading ? (
          <RefreshCw size={14} className="animate-spin text-slate-500 flex-shrink-0" />
        ) : open ? (
          <ChevronUp size={14} className="text-slate-500 flex-shrink-0" />
        ) : (
          <ChevronDown size={14} className="text-slate-500 flex-shrink-0" />
        )}
      </button>

      {open && detail && (
        <div className="px-4 pb-4 border-t space-y-3" style={{ borderColor: 'rgba(0,198,255,0.08)' }}>
          {/* Transcript */}
          <div className="pt-3 space-y-2 max-h-72 overflow-y-auto">
            {(detail.transcript || []).map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div
                  className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs"
                  style={{ background: msg.role === 'user' ? 'rgba(0,198,255,0.2)' : 'rgba(124,58,237,0.2)' }}
                >
                  {msg.role === 'user' ? <User size={10} className="text-cyan-400" /> : <BarChart2 size={10} className="text-purple-400" />}
                </div>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-xl text-xs text-slate-300 ${msg.role === 'user' ? 'msg-bubble-user' : 'msg-bubble-agent'}`}
                  style={{
                    background: msg.role === 'user' ? 'rgba(0,198,255,0.08)' : 'rgba(124,58,237,0.08)',
                    border: `1px solid ${msg.role === 'user' ? 'rgba(0,198,255,0.15)' : 'rgba(124,58,237,0.15)'}`,
                  }}
                >
                  {msg.message}
                </div>
              </div>
            ))}
          </div>

          {/* Audio player */}
          <div>
            <p className="text-xs text-slate-500 mb-1">Recording</p>
            {audioUrl ? (
              <audio
                controls
                className="w-full"
                style={{ height: '32px', filter: 'invert(0.8) hue-rotate(180deg)' }}
                src={audioUrl}
              />
            ) : audioError ? (
              <p className="text-xs text-red-400">Audio unavailable: {audioError}</p>
            ) : (
              <p className="text-xs text-slate-600">Loading audio…</p>
            )}
          </div>

          {/* Summary */}
          {detail.analysis?.transcript_summary && (
            <div className="glass rounded-lg p-3">
              <p className="text-xs font-medium text-slate-400 mb-1">AI Summary</p>
              <p className="text-xs text-slate-300">{detail.analysis.transcript_summary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { setActivePage, showToast } = useApp();
  const [stats, setStats] = useState({ voices: 0, agents: 0 });
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [agentFilter, setAgentFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [convTab, setConvTab] = useState('all');
  const convListRef = useRef(null);

  function goToConvTab(tab) {
    setConvTab(tab);
    convListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function loadConversations() {
    setLoading(true);
    try {
      const data = await elevenLabs.getConversations(agentFilter || undefined);
      setConversations(data.conversations || []);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const xiKey = localStorage.getItem('xi_api_key');
    if (!xiKey) return;
    Promise.allSettled([elevenLabs.getVoices(), elevenLabs.getAgents()]).then(([v, a]) => {
      setStats({
        voices: v.status === 'fulfilled' ? (v.value.voices?.length ?? 0) : 0,
        agents: a.status === 'fulfilled' ? (a.value.agents?.length ?? 0) : 0,
      });
    });
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply date range filter (client-side) on top of fetched conversations
  const fromTs = dateFrom ? new Date(dateFrom).getTime() : null;
  const toTs = dateTo ? new Date(dateTo).getTime() + 86400000 - 1 : null;
  const filteredConversations = conversations.filter(c => {
    if (!fromTs && !toTs) return true;
    const secs = c.start_time_unix_secs ?? c.metadata?.start_time_unix_secs;
    if (secs == null) return true;
    const ms = secs * 1000;
    if (fromTs && ms < fromTs) return false;
    if (toTs && ms > toTs) return false;
    return true;
  });

  const cards = [
    { label: 'Voices', value: stats.voices || '—', icon: Mic, color: '#00c6ff', page: 'xi-voices' },
    { label: 'Agents', value: stats.agents || '—', icon: Bot, color: '#7c3aed', page: 'xi-agents' },
    { label: 'Conversations', value: filteredConversations.length || '—', icon: Activity, color: '#10b981' },
    { label: 'Workflows', value: '—', icon: Workflow, color: '#f59e0b', page: 'n8n' },
  ];

  // Build duration distribution for chart
  const buckets = { '0-1m': 0, '1-3m': 0, '3-5m': 0, '5-10m': 0, '10m+': 0 };
  filteredConversations.forEach(c => {
    const s = c.call_duration_secs ?? c.metadata?.call_duration_secs ?? 0;
    if (s < 60) buckets['0-1m']++;
    else if (s < 180) buckets['1-3m']++;
    else if (s < 300) buckets['3-5m']++;
    else if (s < 600) buckets['5-10m']++;
    else buckets['10m+']++;
  });
  const durationChartData = Object.entries(buckets).map(([name, count]) => ({ name, count }));

  // Group by evaluation criteria result (call_successful)
  const passed = filteredConversations.filter(c => (c.call_successful || c.analysis?.call_successful) === 'success');
  const failed = filteredConversations.filter(c => (c.call_successful || c.analysis?.call_successful) === 'failure');
  const unevaluated = filteredConversations.filter(c => {
    const r = c.call_successful || c.analysis?.call_successful;
    return r !== 'success' && r !== 'failure';
  });

  const avgDuration = duration(Math.round(filteredConversations.reduce((a, c) => a + (c.call_duration_secs ?? c.metadata?.call_duration_secs ?? 0), 0) / (filteredConversations.length || 1)));
  const completed = filteredConversations.filter(c => c.status === 'done').length;

  return (
    <div className="fade-in p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        </div>
        <button onClick={loadConversations} disabled={loading} className="btn-ghost">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Overview strip */}
      <div className="glass-card rounded-xl divide-y divide-white/5 sm:divide-y-0 sm:divide-x sm:flex" style={{ borderColor: 'rgba(0,198,255,0.08)' }}>
        {cards.map(({ label, value, icon: Icon, color, page }) => (
          <button
            key={label}
            onClick={() => page && setActivePage(page)}
            className="flex-1 flex items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-white/[0.03]"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}1a` }}
            >
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <p className="text-lg font-bold text-white leading-tight">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Conversation insights */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
          <Activity size={14} />
          CONVERSATION INSIGHTS
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <button onClick={() => goToConvTab('all')} className="glass-card rounded-xl p-4 text-center hover:bg-white/[0.03] transition-colors">
            <MessageSquare size={16} className="mx-auto mb-2 text-cyan-400" />
            <p className="text-2xl font-bold text-white">{filteredConversations.length || '—'}</p>
            <p className="text-xs text-slate-500 mt-0.5">Overall</p>
          </button>
          <button onClick={() => goToConvTab('passed')} className="glass-card rounded-xl p-4 text-center hover:bg-white/[0.03] transition-colors">
            <CheckCircle2 size={16} className="mx-auto mb-2 text-green-400" />
            <p className="text-2xl font-bold text-green-400">{passed.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Passed</p>
          </button>
          <button onClick={() => goToConvTab('failed')} className="glass-card rounded-xl p-4 text-center hover:bg-white/[0.03] transition-colors">
            <XCircle size={16} className="mx-auto mb-2 text-red-400" />
            <p className="text-2xl font-bold text-red-400">{failed.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Failed</p>
          </button>
          <button onClick={() => goToConvTab('unevaluated')} className="glass-card rounded-xl p-4 text-center hover:bg-white/[0.03] transition-colors">
            <HelpCircle size={16} className="mx-auto mb-2 text-slate-400" />
            <p className="text-2xl font-bold text-white">{unevaluated.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Unevaluated</p>
          </button>
          <div className="glass-card rounded-xl p-4 text-center">
            <Clock size={16} className="mx-auto mb-2 text-cyan-400" />
            <p className="text-2xl font-bold text-white">{avgDuration}</p>
            <p className="text-xs text-slate-500 mt-0.5">Avg Duration</p>
          </div>
          <button onClick={() => goToConvTab('all')} className="glass-card rounded-xl p-4 text-center hover:bg-white/[0.03] transition-colors">
            <CheckCircle2 size={16} className="mx-auto mb-2 text-cyan-400" />
            <p className="text-2xl font-bold text-white">{completed}</p>
            <p className="text-xs text-slate-500 mt-0.5">Completed</p>
          </button>
        </div>
        {passed.length === 0 && failed.length === 0 && conversations.length > 0 && (
          <p className="text-xs text-slate-500 text-center mt-3">
            No conversations have evaluation results yet. Add Evaluation Criteria to an agent to start tracking pass/fail outcomes.
          </p>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

        {filteredConversations.length > 0 && (
          <div className="glass-card rounded-xl p-5">
            <p className="text-sm font-semibold text-white mb-4">Duration Distribution</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={durationChartData}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface-tooltip)', border: '1px solid rgba(0,198,255,0.2)', borderRadius: 8 }}
                  labelStyle={{ color: 'var(--text-muted)' }}
                  itemStyle={{ color: '#00c6ff' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {durationChartData.map((_, i) => (
                    <Cell key={i} fill={`rgba(0,198,255,${0.3 + i * 0.14})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={agentFilter}
          onChange={e => setAgentFilter(e.target.value)}
          placeholder="Filter conversations by Agent ID…"
          className="sm:flex-1"
        />
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 flex-shrink-0">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="flex-1 sm:flex-initial"
          />
          <label className="text-xs text-slate-500 flex-shrink-0">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="flex-1 sm:flex-initial"
          />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="btn-ghost flex-shrink-0">Clear</button>
          )}
        </div>
        <button onClick={loadConversations} className="btn-ghost flex-shrink-0">Apply</button>
      </div>

      {/* Conversation tabs */}
      <div ref={convListRef}>
        <div className="tab-bar flex gap-1 p-1 rounded-xl mb-4">
          {[
            { id: 'all', label: 'All', count: filteredConversations.length },
            { id: 'passed', label: 'Passed', count: passed.length },
            { id: 'failed', label: 'Failed', count: failed.length },
            { id: 'unevaluated', label: 'Unevaluated', count: unevaluated.length },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setConvTab(t.id)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${convTab === t.id ? 'tab-active' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
            Loading conversations…
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
            No conversations found. Check your API key in Settings.
          </div>
        ) : (
          <div className="space-y-3">
            {(convTab === 'all' ? filteredConversations : convTab === 'passed' ? passed : convTab === 'failed' ? failed : unevaluated)
              .map(c => <ConvCard key={c.conversation_id} conv={c} />)}
            {(convTab === 'all' ? filteredConversations : convTab === 'passed' ? passed : convTab === 'failed' ? failed : unevaluated).length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <HelpCircle size={32} className="mx-auto mb-3 opacity-30" />
                No conversations in this category.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
