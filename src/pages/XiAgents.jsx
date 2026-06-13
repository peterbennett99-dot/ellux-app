import { useState, useEffect } from 'react';
import { Bot, RefreshCw, Save, ChevronDown, ChevronUp, Settings2, Sparkles } from 'lucide-react';
import { elevenLabs } from '../lib/api';
import { useApp } from '../lib/store';

function AgentCard({ agent: initialAgent }) {
  const [open, setOpen] = useState(false);
  const [agent, setAgent] = useState(initialAgent);
  const [detail, setDetail] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast, selectedAgent, setSelectedAgent } = useApp();
  const isSelected = selectedAgent?.id === agent.agent_id;

  async function fetchDetail() {
    if (detail) { setOpen(o => !o); return; }
    setLoading(true);
    try {
      const d = await elevenLabs.getAgent(agent.agent_id);
      setDetail(d);
      setOpen(true);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!detail) return;
    setSaving(true);
    try {
      await elevenLabs.updateAgent(agent.agent_id, {
        name: detail.name,
        conversation_config: detail.conversation_config,
      });
      showToast('Agent updated', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  const cfg = detail?.conversation_config || {};
  const agent_cfg = cfg.agent || {};
  const tts = cfg.tts || {};

  return (
    <div className={`glass-card rounded-xl overflow-hidden ${isSelected ? 'ring-2 ring-cyan-400' : ''}`}>
      <div
        role="button"
        tabIndex={0}
        onClick={fetchDetail}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fetchDetail(); }}
        className="w-full flex items-center gap-4 p-4 text-left cursor-pointer"
      >
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(124,58,237,0.2)' }}>
          <Bot size={16} className="text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{agent.name || 'Unnamed Agent'}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <p className="text-xs text-slate-500 font-mono">{agent.agent_id}</p>
            {isSelected && <span className="badge badge-green">Selected for Demo</span>}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setSelectedAgent({ id: agent.agent_id, name: agent.name }); }}
          className={isSelected ? 'btn-primary' : 'btn-ghost'}
          title={isSelected ? 'Deselect for demo' : 'Use this agent in the demo'}
          style={{ padding: '6px 10px' }}
        >
          <Sparkles size={13} />
        </button>
        {loading ? (
          <RefreshCw size={14} className="animate-spin text-slate-500" />
        ) : open ? (
          <ChevronUp size={16} className="text-slate-500 flex-shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-slate-500 flex-shrink-0" />
        )}
      </div>

      {open && detail && (
        <div className="px-4 pb-4 space-y-4 border-t" style={{ borderColor: 'rgba(0,198,255,0.08)' }}>
          <div className="pt-3 space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Agent Name</label>
              <input
                value={detail.name || ''}
                onChange={e => setDetail(d => ({ ...d, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">System Prompt</label>
              <textarea
                rows={4}
                value={agent_cfg.prompt?.prompt || ''}
                onChange={e => setDetail(d => ({
                  ...d,
                  conversation_config: {
                    ...d.conversation_config,
                    agent: {
                      ...d.conversation_config?.agent,
                      prompt: { ...d.conversation_config?.agent?.prompt, prompt: e.target.value }
                    }
                  }
                }))}
                style={{ resize: 'vertical', minHeight: '80px' }}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">First Message</label>
              <input
                value={agent_cfg.first_message || ''}
                onChange={e => setDetail(d => ({
                  ...d,
                  conversation_config: {
                    ...d.conversation_config,
                    agent: { ...d.conversation_config?.agent, first_message: e.target.value }
                  }
                }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Language</label>
                <select
                  value={agent_cfg.language || 'en'}
                  onChange={e => setDetail(d => ({
                    ...d,
                    conversation_config: {
                      ...d.conversation_config,
                      agent: { ...d.conversation_config?.agent, language: e.target.value }
                    }
                  }))}
                >
                  {['en','es','fr','de','it','pt','pl','hi','ar'].map(l => (
                    <option key={l} value={l}>{l.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Voice ID (TTS)</label>
                <input
                  value={tts.voice_id || ''}
                  onChange={e => setDetail(d => ({
                    ...d,
                    conversation_config: {
                      ...d.conversation_config,
                      tts: { ...d.conversation_config?.tts, voice_id: e.target.value }
                    }
                  }))}
                  placeholder="voice_id…"
                />
              </div>
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} className="btn-primary w-full justify-center">
            <Save size={14} />
            {saving ? 'Saving…' : 'Save Agent'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function XiAgents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useApp();

  async function load() {
    setLoading(true);
    try {
      const data = await elevenLabs.getAgents();
      setAgents(data.agents || []);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="fade-in p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Agents</h1>
          <p className="text-sm text-slate-500 mt-1">Configure ElevenLabs Conversational AI agents</p>
        </div>
        <button onClick={load} disabled={loading} className="btn-ghost">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
          Loading agents…
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Bot size={32} className="mx-auto mb-3 opacity-30" />
          No agents found. Check your API key in Settings.
        </div>
      ) : (
        <div className="space-y-3">
          {agents.map(a => <AgentCard key={a.agent_id} agent={a} />)}
        </div>
      )}
    </div>
  );
}
