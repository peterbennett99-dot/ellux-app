import { useState, useEffect } from 'react';
import { BarChart2, RefreshCw, Play, Clock, MessageSquare, User, ChevronDown, ChevronUp, Download, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { elevenLabs } from '../lib/api';
import { useApp } from '../lib/store';

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
            {conv.metadata?.start_time_unix_secs && (
              <span className="text-xs text-slate-500">
                {new Date(conv.metadata.start_time_unix_secs * 1000).toLocaleDateString()}
              </span>
            )}
            {conv.metadata?.call_duration_secs !== undefined && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock size={10} />
                {duration(conv.metadata.call_duration_secs)}
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
                  className="max-w-[80%] px-3 py-2 rounded-xl text-xs text-slate-300"
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

export default function XiReports() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [agentFilter, setAgentFilter] = useState('');
  const { showToast } = useApp();

  async function load() {
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

  useEffect(() => { load(); }, []);

  // Build duration distribution for chart
  const buckets = { '0-1m': 0, '1-3m': 0, '3-5m': 0, '5-10m': 0, '10m+': 0 };
  conversations.forEach(c => {
    const s = c.metadata?.call_duration_secs || 0;
    if (s < 60) buckets['0-1m']++;
    else if (s < 180) buckets['1-3m']++;
    else if (s < 300) buckets['3-5m']++;
    else if (s < 600) buckets['5-10m']++;
    else buckets['10m+']++;
  });
  const chartData = Object.entries(buckets).map(([name, count]) => ({ name, count }));

  // Group by evaluation criteria result (call_successful)
  const passed = conversations.filter(c => (c.call_successful || c.analysis?.call_successful) === 'success');
  const failed = conversations.filter(c => (c.call_successful || c.analysis?.call_successful) === 'failure');
  const unevaluated = conversations.filter(c => {
    const r = c.call_successful || c.analysis?.call_successful;
    return r !== 'success' && r !== 'failure';
  });

  return (
    <div className="fade-in p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Conversations</h1>
          <p className="text-sm text-slate-500 mt-1">Conversation reports & recordings</p>
        </div>
        <button onClick={load} disabled={loading} className="btn-ghost">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Interactions', value: conversations.length },
          { label: 'Avg Duration', value: duration(Math.round(conversations.reduce((a, c) => a + (c.metadata?.call_duration_secs || 0), 0) / (conversations.length || 1))) },
          { label: 'Completed', value: conversations.filter(c => c.status === 'done').length },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pass / Fail criteria stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-white">{passed.length + failed.length + unevaluated.length}</p>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center justify-center gap-1"><MessageSquare size={11} /> Overall Interactions</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-green-400">{passed.length}</p>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center justify-center gap-1"><CheckCircle2 size={11} className="text-green-400" /> Passed Interactions</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-red-400">{failed.length}</p>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center justify-center gap-1"><XCircle size={11} className="text-red-400" /> Failed Interactions</p>
        </div>
      </div>
      {passed.length === 0 && failed.length === 0 && conversations.length > 0 && (
        <p className="text-xs text-slate-500 text-center">
          No conversations have evaluation results yet. Add Evaluation Criteria to an agent to start tracking pass/fail outcomes.
        </p>
      )}

      {/* Chart */}
      {conversations.length > 0 && (
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-400 mb-3">DURATION DISTRIBUTION</p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
              <Tooltip
                contentStyle={{ background: '#0d1220', border: '1px solid rgba(0,198,255,0.2)', borderRadius: 8 }}
                labelStyle={{ color: '#94a3b8' }}
                itemStyle={{ color: '#00c6ff' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={`rgba(0,198,255,${0.3 + i * 0.14})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        <input
          value={agentFilter}
          onChange={e => setAgentFilter(e.target.value)}
          placeholder="Filter by Agent ID…"
          style={{ flex: 1 }}
        />
        <button onClick={load} className="btn-ghost flex-shrink-0">Apply</button>
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
        <div className="space-y-6">
          {passed.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold tracking-widest text-green-400 flex items-center gap-1.5">
                <CheckCircle2 size={12} /> PASSED ({passed.length})
              </p>
              {passed.map(c => <ConvCard key={c.conversation_id} conv={c} />)}
            </div>
          )}
          {failed.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold tracking-widest text-red-400 flex items-center gap-1.5">
                <XCircle size={12} /> FAILED ({failed.length})
              </p>
              {failed.map(c => <ConvCard key={c.conversation_id} conv={c} />)}
            </div>
          )}
          {unevaluated.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold tracking-widest text-slate-500 flex items-center gap-1.5">
                <HelpCircle size={12} /> UNEVALUATED ({unevaluated.length})
              </p>
              {unevaluated.map(c => <ConvCard key={c.conversation_id} conv={c} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
