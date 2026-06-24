import { useState, useEffect } from 'react';
import { Bot, RefreshCw, Save, ChevronDown, ChevronUp, Settings2, Sparkles, Plus, X, Info } from 'lucide-react';
import { elevenLabs } from '../lib/api';
import { useApp } from '../lib/store';

const LANGUAGES = ['en','es','fr','de','it','pt','pl','hi','ar'];
const LLM_MODELS = [
  'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro',
  'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo',
  'claude-3-7-sonnet', 'claude-3-5-sonnet', 'claude-3-haiku',
];
const TTS_OUTPUT_FORMATS = [
  'pcm_8000', 'pcm_16000', 'pcm_22050', 'pcm_24000', 'pcm_44100',
  'ulaw_8000', 'alaw_8000', 'mp3_22050_32', 'mp3_44100_128',
];

function SliderField({ label, value, onChange, min, max, step, formatValue }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-slate-400">{label}</label>
        <span className="text-xs font-mono text-cyan-400">{formatValue ? formatValue(value) : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

function CreateAgentPanel({ onCreated, onClose }) {
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [language, setLanguage] = useState('en');
  const [llm, setLlm] = useState('gemini-2.5-flash');
  const [voiceId, setVoiceId] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [stability, setStability] = useState(0.5);
  const [similarityBoost, setSimilarityBoost] = useState(0.8);
  const [temperature, setTemperature] = useState(0);
  const [maxTokens, setMaxTokens] = useState(-1);
  const [maxDuration, setMaxDuration] = useState(600);
  const [outputFormat, setOutputFormat] = useState('pcm_16000');
  const [saving, setSaving] = useState(false);
  const { showToast } = useApp();

  async function handleCreate() {
    if (!name.trim()) {
      showToast('Agent name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await elevenLabs.createAgent({
        name,
        conversation_config: {
          agent: {
            prompt: {
              prompt: prompt || undefined,
              llm,
              temperature,
              max_tokens: maxTokens,
            },
            first_message: firstMessage || undefined,
            language,
          },
          tts: {
            voice_id: voiceId || undefined,
            speed,
            stability,
            similarity_boost: similarityBoost,
            agent_output_audio_format: outputFormat,
          },
          conversation: {
            max_duration_seconds: maxDuration,
          },
        },
      });
      showToast(`Agent "${name}" created`, 'success');
      onCreated?.({ agent_id: res.agent_id, name });
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="glass-card rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plus size={16} className="text-cyan-400" />
          <p className="text-sm font-semibold text-white">New Agent</p>
        </div>
        <button onClick={onClose} className="btn-ghost" style={{ padding: '6px 10px' }}>
          <X size={13} />
        </button>
      </div>

      <div className="flex items-start gap-2 rounded-lg p-3" style={{ background: 'rgba(0,198,255,0.06)', border: '1px solid rgba(0,198,255,0.12)' }}>
        <Info size={14} className="text-cyan-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400">
          After creating this agent, configure <strong className="text-slate-300">Evaluation Criteria</strong> in the agent's dashboard
          (Agent → Analysis tab) so conversations can be tracked as Passed / Failed on the Conversations page.
        </p>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-400 block mb-1">Agent Name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="My new agent" />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-400 block mb-1">System Prompt</label>
        <textarea
          rows={4}
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="You are a helpful assistant…"
          style={{ resize: 'vertical', minHeight: '80px' }}
        />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-400 block mb-1">First Message</label>
        <input
          value={firstMessage}
          onChange={e => setFirstMessage(e.target.value)}
          placeholder="Hi, how can I help you today?"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1">Language</label>
          <select value={language} onChange={e => setLanguage(e.target.value)}>
            {LANGUAGES.map(l => (
              <option key={l} value={l}>{l.toUpperCase()}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1">LLM Model</label>
          <select value={llm} onChange={e => setLlm(e.target.value)}>
            {LLM_MODELS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-400 block mb-1">Voice ID (TTS, optional)</label>
        <input value={voiceId} onChange={e => setVoiceId(e.target.value)} placeholder="voice_id…" />
      </div>

      <button
        onClick={() => setShowAdvanced(s => !s)}
        className="btn-ghost w-full justify-center"
        type="button"
      >
        <Settings2 size={13} />
        Advanced Settings
        {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {showAdvanced && (
        <div className="space-y-4 pt-1 border-t" style={{ borderColor: 'rgba(0,198,255,0.08)' }}>
          <div className="grid grid-cols-3 gap-4 pt-3">
            <SliderField
              label="TTS Speed" value={speed} onChange={setSpeed}
              min={0.7} max={1.2} step={0.05}
              formatValue={v => `${v.toFixed(2)}x`}
            />
            <SliderField
              label="Stability" value={stability} onChange={setStability}
              min={0} max={1} step={0.05}
              formatValue={v => v.toFixed(2)}
            />
            <SliderField
              label="Similarity Boost" value={similarityBoost} onChange={setSimilarityBoost}
              min={0} max={1} step={0.05}
              formatValue={v => v.toFixed(2)}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <SliderField
              label="LLM Temperature" value={temperature} onChange={setTemperature}
              min={0} max={1} step={0.05}
              formatValue={v => v.toFixed(2)}
            />
            <SliderField
              label="Max Tokens" value={maxTokens} onChange={setMaxTokens}
              min={-1} max={4000} step={50}
              formatValue={v => v < 0 ? 'Unlimited' : v}
            />
            <SliderField
              label="Max Duration" value={maxDuration} onChange={setMaxDuration}
              min={60} max={3600} step={30}
              formatValue={v => `${Math.round(v / 60)} min`}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">TTS Output Format</label>
            <select value={outputFormat} onChange={e => setOutputFormat(e.target.value)}>
              {TTS_OUTPUT_FORMATS.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <button onClick={handleCreate} disabled={saving} className="btn-primary w-full justify-center">
        <Plus size={14} />
        {saving ? 'Creating…' : 'Create Agent'}
      </button>
    </div>
  );
}

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
          <div className="pt-3 flex items-start gap-2 rounded-lg p-3" style={{ background: 'rgba(0,198,255,0.06)', border: '1px solid rgba(0,198,255,0.12)' }}>
            <Info size={14} className="text-cyan-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-400">
              Set up <strong className="text-slate-300">Evaluation Criteria</strong> for this agent in the agent's dashboard
              (Agent → Analysis tab) — this drives the Passed / Failed breakdown on the Conversations page.
            </p>
          </div>
          <div className="space-y-3">
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
  const [showCreate, setShowCreate] = useState(false);
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

  function handleCreated(agent) {
    setAgents(list => [agent, ...list]);
    setShowCreate(false);
  }

  return (
    <div className="fade-in p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Agents</h1>
          <p className="text-sm text-slate-500 mt-1">Configure conversational AI agents</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCreate(s => !s)} className={showCreate ? 'btn-ghost tab-active' : 'btn-primary'}>
            <Plus size={14} />
            New Agent
          </button>
          <button onClick={load} disabled={loading} className="btn-ghost">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {showCreate && (
        <CreateAgentPanel onCreated={handleCreated} onClose={() => setShowCreate(false)} />
      )}

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
