import { useState, useEffect } from 'react';
import { Code2, Copy, Check, Info, ExternalLink } from 'lucide-react';
import { elevenLabs } from '../lib/api';
import { useApp } from '../lib/store';

const LS_SECRET_ID = 'liveavatar_elevenlabs_secret_id';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="btn-ghost flex-shrink-0"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export default function EmbedWidget() {
  const { selectedAgent, selectedAvatar, selectedVoice, showToast } = useApp();
  const [agents, setAgents] = useState([]);
  const [voices, setVoices] = useState([]);

  const [mode, setMode] = useState('inline'); // 'inline' | 'floating'
  const [agentId, setAgentId] = useState(selectedAgent?.id || '');
  const [useSandbox, setUseSandbox] = useState(!selectedAvatar?.id);
  const [avatarId, setAvatarId] = useState(selectedAvatar?.id || '');
  const [voiceId, setVoiceId] = useState(selectedVoice?.id || '');
  const [name, setName] = useState('AI Assistant');
  const [accent, setAccent] = useState('00c6ff');
  const [autostart, setAutostart] = useState(false);
  const [width, setWidth] = useState('400');
  const [height, setHeight] = useState('600');
  const [fullscreenButton, setFullscreenButton] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const secretId = localStorage.getItem(LS_SECRET_ID) || '';

  useEffect(() => {
    elevenLabs.getAgents().then(d => setAgents(d.agents || [])).catch(() => {});
    elevenLabs.getVoices().then(d => setVoices(d.voices || [])).catch(() => {});
  }, []);

  const origin = window.location.origin;
  const params = new URLSearchParams();
  if (agentId) params.set('agent', agentId);
  if (!useSandbox && avatarId) params.set('avatar', avatarId);
  if (secretId) params.set('secret', secretId);
  if (voiceId) params.set('voice', voiceId);
  if (accent) params.set('accent', accent.replace(/^#/, ''));
  if (name) params.set('name', name);
  if (autostart) params.set('autostart', '1');
  if (fullscreenButton && mode === 'inline') params.set('fullscreen', '1');

  const embedUrl = `${origin}/embed?${params.toString()}`;

  const iframeSnippet = `<iframe
  src="${embedUrl}"
  title="${name}"
  width="${width}"
  height="${height}"
  style="border:none;border-radius:16px;"
  allow="camera; microphone; autoplay"
></iframe>`;

  const launcherSnippet = `<script
  src="${origin}/embed-launcher.js"
  data-agent="${agentId}"${!useSandbox && avatarId ? `\n  data-avatar="${avatarId}"` : ''}${secretId ? `\n  data-secret="${secretId}"` : ''}${voiceId ? `\n  data-voice="${voiceId}"` : ''}
  data-accent="${accent.replace(/^#/, '')}"
  data-name="${name}"${autostart ? '\n  data-autostart="1"' : ''}
  async
></script>`;

  const missingConfig = !agentId || !secretId;

  return (
    <div className="fade-in p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Code2 size={20} className="text-cyan-400" />
          Embed
        </h1>
        <p className="text-sm text-slate-500 mt-1">Add the avatar demo to your own website as an embedded element</p>
      </div>

      {missingConfig && (
        <div className="glass rounded-xl p-4 flex gap-3" style={{ borderColor: 'rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.05)' }}>
          <Info size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-400">
            {!agentId && 'Select an agent below. '}
            {!secretId && (
              <>No registered secret found — go to <strong className="text-slate-300">Preview &amp; Demo</strong> and click "Register from Settings key" first.</>
            )}
          </p>
        </div>
      )}

      <div className="glass-card rounded-xl p-5 space-y-4">
        <p className="text-sm font-semibold text-white">Configuration</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">Agent</label>
            {agents.length === 0 ? (
              <p className="text-xs text-slate-600">No agents found — check your Agents API key in Settings.</p>
            ) : (
              <select value={agentId} onChange={e => setAgentId(e.target.value)}>
                <option value="">Select an agent…</option>
                {agents.map(a => <option key={a.agent_id} value={a.agent_id}>{a.name}</option>)}
              </select>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">Voice override <span className="text-slate-600">(optional)</span></label>
            <select value={voiceId} onChange={e => setVoiceId(e.target.value)}>
              <option value="">Agent default</option>
              {voices.map(v => <option key={v.voice_id} value={v.voice_id}>{v.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">Display name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="AI Assistant" />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">Accent color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={`#${accent.replace(/^#/, '')}`} onChange={e => setAccent(e.target.value.replace(/^#/, ''))} style={{ width: 44, padding: 2, height: 36 }} />
              <input value={accent} onChange={e => setAccent(e.target.value)} placeholder="00c6ff" style={{ flex: 1 }} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input id="sandbox-toggle" type="checkbox" checked={useSandbox} onChange={e => setUseSandbox(e.target.checked)} style={{ width: 'auto' }} />
          <label htmlFor="sandbox-toggle" className="text-sm text-slate-300">
            Sandbox avatar <span className="text-slate-500">(free, "Wayne" — good for testing)</span>
          </label>
        </div>

        {!useSandbox && (
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">Avatar ID</label>
            <input value={avatarId} onChange={e => setAvatarId(e.target.value)} placeholder="Avatar ID from Avatars page" />
          </div>
        )}

        <div className="flex items-center gap-3">
          <input id="autostart-toggle" type="checkbox" checked={autostart} onChange={e => setAutostart(e.target.checked)} style={{ width: 'auto' }} />
          <label htmlFor="autostart-toggle" className="text-sm text-slate-300">
            Auto-start session on load <span className="text-slate-500">(skips the "Start Conversation" button)</span>
          </label>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)' }}>
        {[
          { id: 'inline', label: 'Inline embed' },
          { id: 'floating', label: 'Floating launcher' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setMode(t.id)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${mode === t.id ? 'tab-active' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {mode === 'inline' ? (
        <div className="glass-card rounded-xl p-5 space-y-4">
          <p className="text-sm font-semibold text-white">Inline embed</p>
          <p className="text-xs text-slate-500">
            Place this snippet anywhere in your page's HTML. The widget renders inline, sized to the dimensions below.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Width (px)</label>
              <input value={width} onChange={e => setWidth(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Height (px)</label>
              <input value={height} onChange={e => setHeight(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input id="fullscreen-toggle" type="checkbox" checked={fullscreenButton} onChange={e => setFullscreenButton(e.target.checked)} style={{ width: 'auto' }} />
            <label htmlFor="fullscreen-toggle" className="text-sm text-slate-300">
              Show full screen button <span className="text-slate-500">(lets visitors expand the widget to full screen)</span>
            </label>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">HTML snippet</p>
              <CopyButton text={iframeSnippet} />
            </div>
            <pre className="text-xs text-slate-300 p-3 rounded-lg overflow-x-auto" style={{ background: 'rgba(0,0,0,0.4)', fontFamily: 'monospace' }}>
              {iframeSnippet}
            </pre>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-xl p-5 space-y-4">
          <p className="text-sm font-semibold text-white">Floating launcher</p>
          <p className="text-xs text-slate-500">
            Place this snippet once, anywhere on your page (e.g. just before <code>&lt;/body&gt;</code>). It adds a floating
            button in the bottom-right corner that expands into the avatar chat when clicked.
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">HTML snippet</p>
              <CopyButton text={launcherSnippet} />
            </div>
            <pre className="text-xs text-slate-300 p-3 rounded-lg overflow-x-auto" style={{ background: 'rgba(0,0,0,0.4)', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
              {launcherSnippet}
            </pre>
          </div>
        </div>
      )}

      {/* Live preview */}
      {!missingConfig && (
        <div className="glass-card rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Preview</p>
            <button onClick={() => setShowPreview(v => !v)} className="btn-ghost">
              {showPreview ? 'Hide preview' : 'Show preview'}
            </button>
          </div>
          {!showPreview ? (
            <p className="text-xs text-slate-500">Preview is off by default. Click "Show preview" to load the embed and try it out.</p>
          ) : mode === 'inline' ? (
            <iframe
              src={embedUrl}
              title={name}
              width={width}
              height={height}
              style={{ border: 'none', borderRadius: 16, maxWidth: '100%' }}
              allow="camera; microphone; autoplay"
            />
          ) : (
            <div className="flex items-center gap-3">
              <iframe
                src={`${embedUrl}&launcher=1`}
                title={name}
                width="76"
                height="76"
                style={{ border: 'none', borderRadius: '50%' }}
                allow="camera; microphone; autoplay"
              />
              <p className="text-xs text-slate-500">This is how the collapsed launcher button will look. On your site it's fixed to the bottom-right corner.</p>
            </div>
          )}
        </div>
      )}

      <div className="glass rounded-xl p-4 flex gap-3" style={{ borderColor: 'rgba(0,198,255,0.15)', background: 'rgba(0,198,255,0.04)' }}>
        <Info size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-cyan-400">How this works</p>
          <p className="text-xs text-slate-400 mt-0.5">
            The embed runs entirely in the visitor's browser and mints a short-lived avatar session token using the
            registered secret above — no backend required. Because the secret travels with the embed code, only use this
            on sites you control and trust. For public-facing production sites, consider a server-side token endpoint instead.{' '}
            <a href="https://docs.liveavatar.com" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1">
              Docs <ExternalLink size={10} />
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
