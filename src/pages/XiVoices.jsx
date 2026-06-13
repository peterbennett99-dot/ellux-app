import { useState, useEffect } from 'react';
import { Mic, Search, Save, RefreshCw, ChevronDown, ChevronUp, Play, Pause, Sparkles } from 'lucide-react';
import { elevenLabs } from '../lib/api';
import { useApp } from '../lib/store';

const ATTRS = [
  { key: 'stability', label: 'Stability', hint: 'Higher = more consistent' },
  { key: 'similarity_boost', label: 'Similarity Boost', hint: 'How closely to mimic original' },
  { key: 'style', label: 'Style', hint: 'Expressiveness (0 = natural)' },
  { key: 'use_speaker_boost', label: 'Speaker Boost', type: 'boolean', hint: 'Clarity enhancement' },
];

function VoiceCard({ voice, onSave }) {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(voice.settings || { stability: 0.5, similarity_boost: 0.75, style: 0, use_speaker_boost: true });
  const [saving, setSaving] = useState(false);
  const { showToast, selectedVoice, setSelectedVoice } = useApp();
  const isSelected = selectedVoice?.id === voice.voice_id;

  async function handleSave() {
    setSaving(true);
    try {
      await elevenLabs.editVoiceSettings(voice.voice_id, settings);
      showToast(`Saved settings for "${voice.name}"`, 'success');
      onSave?.(voice.voice_id, settings);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  const labels = voice.labels || {};
  const category = voice.category || 'custom';

  return (
    <div className={`glass-card rounded-xl overflow-hidden ${isSelected ? 'ring-2 ring-cyan-400' : ''}`}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpen(!open); }}
        className="w-full flex flex-col items-center text-center gap-2 p-5 cursor-pointer relative"
      >
        <button
          onClick={(e) => { e.stopPropagation(); setSelectedVoice({ id: voice.voice_id, name: voice.name }); }}
          className={isSelected ? 'btn-primary' : 'btn-ghost'}
          title={isSelected ? 'Deselect for demo' : 'Use this voice in the demo'}
          style={{ padding: '6px 10px', position: 'absolute', top: '12px', right: '12px' }}
        >
          <Sparkles size={13} />
        </button>
        <div className="w-16 h-16 rounded-full accent-gradient flex items-center justify-center flex-shrink-0">
          <Mic size={24} className="text-white" />
        </div>
        <p className="text-sm font-semibold text-white truncate w-full">{voice.name}</p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {labels.gender && <span className="badge badge-blue">{labels.gender}</span>}
          {labels.accent && <span className="badge badge-purple">{labels.accent}</span>}
          <span className="badge badge-amber">{category}</span>
          {isSelected && <span className="badge badge-green">Selected for Demo</span>}
        </div>
        {open ? <ChevronUp size={16} className="text-slate-500 flex-shrink-0" /> : <ChevronDown size={16} className="text-slate-500 flex-shrink-0" />}
      </div>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t" style={{ borderColor: 'rgba(0,198,255,0.08)' }}>
          <p className="text-xs text-slate-500 pt-3 font-mono">{voice.voice_id}</p>

          {ATTRS.map(({ key, label, hint, type }) => (
            <div key={key}>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-slate-300">{label}</label>
                {type !== 'boolean' && (
                  <span className="text-xs text-cyan-400 font-mono">{(settings[key] ?? 0).toFixed(2)}</span>
                )}
              </div>
              {type === 'boolean' ? (
                <button
                  onClick={() => setSettings(s => ({ ...s, [key]: !s[key] }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${settings[key] ? 'bg-cyan-500' : 'bg-slate-700'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings[key] ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              ) : (
                <input
                  type="range" min="0" max="1" step="0.01"
                  value={settings[key] ?? 0}
                  onChange={e => setSettings(s => ({ ...s, [key]: parseFloat(e.target.value) }))}
                  className="range-slider"
                />
              )}
              <p className="text-xs text-slate-600 mt-1">{hint}</p>
            </div>
          ))}

          <button onClick={handleSave} disabled={saving} className="btn-primary w-full justify-center">
            <Save size={14} />
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function XiVoices() {
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const { showToast } = useApp();

  async function load() {
    setLoading(true);
    try {
      const data = await elevenLabs.getVoices();
      setVoices(data.voices || []);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = voices.filter(v =>
    v.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Voices</h1>
          <p className="text-sm text-slate-500 mt-1">Manage voice settings</p>
        </div>
        <button onClick={load} disabled={loading} className="btn-ghost">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search voices…"
          style={{ paddingLeft: '36px' }}
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
          Loading voices…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Mic size={32} className="mx-auto mb-3 opacity-30" />
          {voices.length === 0 ? 'No voices found. Check your API key in Settings.' : 'No voices match your search.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          {filtered.map(v => (
            <VoiceCard key={v.voice_id} voice={v} />
          ))}
        </div>
      )}
    </div>
  );
}
