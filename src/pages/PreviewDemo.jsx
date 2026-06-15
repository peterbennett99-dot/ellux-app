import { useState, useEffect, useRef } from 'react';
import {
  LiveAvatarSession, SessionEvent, SessionState, AgentEventsEnum,
} from '@heygen/liveavatar-web-sdk';
import {
  Play, Square, MicOff, Mic, Zap, KeyRound, RefreshCw, Sparkles, ExternalLink,
} from 'lucide-react';
import { liveAvatar, elevenLabs, n8n } from '../lib/api';
import { useApp } from '../lib/store';

const SANDBOX_AVATAR_ID = 'dd73ea75-1218-4ef3-92ce-606d5f7fbc0a'; // "Wayne" — only avatar available in sandbox mode
const LS_SECRET_ID = 'liveavatar_elevenlabs_secret_id';
const LS_AGENT_ID = 'liveavatar_demo_agent_id';
const LS_AVATAR_ID = 'liveavatar_demo_avatar_id';
const LS_WEBHOOK_ID = 'liveavatar_demo_webhook_id';

function loadWebhooks() {
  try { return JSON.parse(localStorage.getItem('ellux_custom_webhooks') || '[]'); } catch { return []; }
}

const STATE_COLORS = {
  [SessionState.INACTIVE]: '#64748b',
  [SessionState.CONNECTING]: '#f59e0b',
  [SessionState.CONNECTED]: '#10b981',
  [SessionState.DISCONNECTING]: '#f59e0b',
  [SessionState.DISCONNECTED]: '#64748b',
};

export default function PreviewDemo() {
  const { showToast, selectedAgent, selectedAvatar, selectedVoice } = useApp();
  const videoRef = useRef(null);
  const sessionRef = useRef(null);

  const [agents, setAgents] = useState([]);
  const [webhooks, setWebhooks] = useState(loadWebhooks());
  const [secretId, setSecretId] = useState(localStorage.getItem(LS_SECRET_ID) || '');
  const [agentId, setAgentId] = useState(selectedAgent?.id || localStorage.getItem(LS_AGENT_ID) || '');
  const [avatarId, setAvatarId] = useState(selectedAvatar?.id || localStorage.getItem(LS_AVATAR_ID) || SANDBOX_AVATAR_ID);
  const [webhookId, setWebhookId] = useState(localStorage.getItem(LS_WEBHOOK_ID) || '');
  const [sandbox, setSandbox] = useState(!selectedAvatar?.id);
  const [registering, setRegistering] = useState(false);
  const [starting, setStarting] = useState(false);
  const [state, setState] = useState(SessionState.INACTIVE);
  const [live, setLive] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState([]);

  useEffect(() => {
    elevenLabs.getAgents().then(d => setAgents(d.agents || [])).catch(() => {});
    return () => { sessionRef.current?.stop(); };
  }, []);

  // Keep the demo in sync with whatever is marked "Selected for Demo" elsewhere in Ellux.
  useEffect(() => {
    if (selectedAgent?.id) persist(LS_AGENT_ID, selectedAgent.id, setAgentId);
  }, [selectedAgent?.id]);

  useEffect(() => {
    if (selectedAvatar?.id) persist(LS_AVATAR_ID, selectedAvatar.id, setAvatarId);
  }, [selectedAvatar?.id]);

  function persist(key, val, setter) {
    setter(val);
    if (val) localStorage.setItem(key, val); else localStorage.removeItem(key);
  }

  function fireWebhook(eventName) {
    const wh = webhooks.find(w => w.id === webhookId);
    if (!wh) return;
    n8n.triggerWebhook(wh.url, { event: eventName, source: 'ellux-preview-demo', avatar_id: avatarId, agent_id: agentId, ts: new Date().toISOString() })
      .catch(e => showToast(`Workflow webhook (${eventName}) failed: ${e.message}`, 'error'));
  }

  async function registerSecret() {
    const xiKey = localStorage.getItem('xi_api_key');
    if (!xiKey) { showToast('Add your Agents API key in Settings first', 'error'); return; }
    setRegistering(true);
    try {
      const res = await liveAvatar.registerSecret('Ellux Agents Key', 'ELEVENLABS_API_KEY', xiKey);
      const id = res.data?.id;
      if (!id) throw new Error('No secret id returned');
      persist(LS_SECRET_ID, id, setSecretId);
      showToast('Agents secret registered with Avatars', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setRegistering(false);
    }
  }

  async function startSession() {
    if (!agentId) { showToast('Select an agent', 'error'); return; }
    if (!secretId) { showToast('Register your secret first', 'error'); return; }
    if (!avatarId) { showToast('Enter an Avatar ID', 'error'); return; }

    setStarting(true);
    try {
      if (selectedVoice?.id) {
        try {
          const detail = await elevenLabs.getAgent(agentId);
          if (detail.conversation_config?.tts?.voice_id !== selectedVoice.id) {
            await elevenLabs.updateAgent(agentId, {
              name: detail.name,
              conversation_config: {
                ...detail.conversation_config,
                tts: { ...detail.conversation_config?.tts, voice_id: selectedVoice.id },
              },
            });
          }
        } catch (e) {
          showToast(`Could not apply selected voice: ${e.message}`, 'error');
        }
      }

      const body = {
        mode: 'LITE',
        avatar_id: sandbox ? SANDBOX_AVATAR_ID : avatarId,
        is_sandbox: sandbox,
        elevenlabs_agent_config: { agent_id: agentId, secret_id: secretId },
      };
      const res = await liveAvatar.createSessionToken(body);
      const token = res.data?.session_token;
      if (!token) throw new Error('No session_token returned');

      const session = new LiveAvatarSession(token, { voiceChat: true });
      sessionRef.current = session;

      session.on(SessionEvent.SESSION_STATE_CHANGED, s => setState(s));
      session.on(SessionEvent.SESSION_STREAM_READY, () => {
        if (videoRef.current) session.attach(videoRef.current);
        setLive(true);
        fireWebhook('session.started');
      });
      session.on(SessionEvent.SESSION_DISCONNECTED, () => {
        setLive(false);
        setListening(false);
        fireWebhook('session.ended');
      });
      session.on(AgentEventsEnum.USER_TRANSCRIPTION, e => {
        setTranscript(t => [...t.slice(-8), { speaker: 'You', text: e.text }]);
      });
      session.on(AgentEventsEnum.AVATAR_TRANSCRIPTION, e => {
        setTranscript(t => [...t.slice(-8), { speaker: 'Avatar', text: e.text }]);
      });
      // Barge-in: as soon as the user starts speaking, interrupt the avatar's current response.
      session.on(AgentEventsEnum.USER_SPEAK_STARTED, () => {
        safeInterrupt(session);
      });

      await session.start();
      showToast('Live session started', 'success');
    } catch (e) {
      showToast(e.message, 'error');
      setState(SessionState.INACTIVE);
    } finally {
      setStarting(false);
    }
  }

  async function stopSession() {
    try {
      await sessionRef.current?.stop();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      sessionRef.current = null;
      setLive(false);
      setListening(false);
      setState(SessionState.INACTIVE);
      setTranscript([]);
    }
  }

  function toggleListening() {
    const session = sessionRef.current;
    if (!session) return;
    if (listening) { session.stopListening(); setListening(false); }
    else { session.startListening(); setListening(true); }
  }

  function safeInterrupt(session) {
    try {
      (session ?? sessionRef.current)?.interrupt();
    } catch (e) {
      showToast(e.message, 'error');
    }
  }

  function interrupt() {
    safeInterrupt();
  }

  return (
    <div className="fade-in p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles size={20} className="text-cyan-400" />
          Preview &amp; Demo
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          End-to-end test bench — an avatar streaming session driven by an agent, configured from Ellux.
        </p>
      </div>

      {(selectedAgent || selectedAvatar || selectedVoice) && (
        <div className="glass rounded-xl p-4 flex flex-wrap gap-2" style={{ borderColor: 'rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.04)' }}>
          <span className="text-xs font-semibold text-green-400 flex items-center gap-1.5"><Sparkles size={12} /> Selected for Demo:</span>
          {selectedAgent && <span className="badge badge-green">Agent: {selectedAgent.name}</span>}
          {selectedAvatar && <span className="badge badge-green">Avatar: {selectedAvatar.name}</span>}
          {selectedVoice && <span className="badge badge-green">Voice: {selectedVoice.name}</span>}
        </div>
      )}

      {!live && (
        <div className="glass-card rounded-xl p-5 space-y-4">
          <p className="text-sm font-semibold text-white">Session Configuration</p>

          <div className="flex items-center gap-3">
            <input id="sandbox-toggle" type="checkbox" checked={sandbox} onChange={e => setSandbox(e.target.checked)} style={{ width: 'auto' }} />
            <label htmlFor="sandbox-toggle" className="text-sm text-slate-300">
              Sandbox mode <span className="text-slate-500">(free, ~1 min, "Wayne" avatar only)</span>
            </label>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">Agent</label>
            {agents.length === 0 ? (
              <p className="text-xs text-slate-600">No agents found — check your Agents API key in Settings.</p>
            ) : (
              <select value={agentId} onChange={e => persist(LS_AGENT_ID, e.target.value, setAgentId)}>
                <option value="">Select an agent…</option>
                {agents.map(a => <option key={a.agent_id} value={a.agent_id}>{a.name}</option>)}
              </select>
            )}
          </div>

          {!sandbox && (
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Avatar ID</label>
              <input value={avatarId} onChange={e => persist(LS_AVATAR_ID, e.target.value, setAvatarId)} placeholder="Avatar ID from Avatars page" />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">Agents API Secret</label>
            <div className="flex items-center gap-2">
              <input value={secretId} onChange={e => persist(LS_SECRET_ID, e.target.value, setSecretId)} placeholder="Registered secret_id" style={{ flex: 1 }} />
              <button onClick={registerSecret} disabled={registering} className="btn-ghost flex-shrink-0">
                <KeyRound size={13} />
                {registering ? 'Registering…' : 'Register from Settings key'}
              </button>
            </div>
            <p className="text-xs text-slate-600 mt-1">Registers your Agents API key (Settings) as an Avatars secret, one time — required even in sandbox mode.</p>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">Workflow Webhook on session events <span className="text-slate-600">(optional)</span></label>
            {webhooks.length === 0 ? (
              <p className="text-xs text-slate-600">No webhooks configured — add one on the Workflows page to enable this overlay.</p>
            ) : (
              <select value={webhookId} onChange={e => persist(LS_WEBHOOK_ID, e.target.value, setWebhookId)}>
                <option value="">None</option>
                {webhooks.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            )}
          </div>

          <button onClick={startSession} disabled={starting} className="btn-primary w-full justify-center" style={{ padding: '12px' }}>
            <Play size={15} />
            {starting ? 'Starting…' : 'Start Live Session'}
          </button>
        </div>
      )}

      {/* Video */}
      <div className="glass-card rounded-xl overflow-hidden" style={{ display: live || starting ? 'block' : 'none' }}>
        <div className="relative" style={{ aspectRatio: '16/9', background: '#000' }}>
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.6)' }}>
            <div className="w-2 h-2 rounded-full" style={{ background: STATE_COLORS[state] }} />
            <span className="text-xs text-slate-200">{state}</span>
          </div>
          {transcript.length > 0 && (
            <div className="absolute bottom-3 left-3 right-3 rounded-lg px-3 py-2 text-xs space-y-0.5" style={{ background: 'rgba(0,0,0,0.7)', maxHeight: '30%', overflowY: 'auto' }}>
              {transcript.map((t, i) => (
                <p key={i} className={t.speaker === 'You' ? 'text-cyan-300' : 'text-slate-200'}>
                  <strong>{t.speaker}:</strong> {t.text}
                </p>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 flex items-center gap-2 flex-wrap">
          <button onClick={toggleListening} disabled={!live} className="btn-ghost">
            {listening ? <MicOff size={14} /> : <Mic size={14} />}
            {listening ? 'Stop Listening' : 'Start Listening'}
          </button>
          <button onClick={interrupt} disabled={!live} className="btn-ghost">
            <Zap size={14} />
            Interrupt
          </button>
          <button onClick={stopSession} className="btn-danger ml-auto">
            <Square size={13} />
            End Session
          </button>
        </div>
      </div>

      <div className="glass rounded-xl p-4 flex gap-3" style={{ borderColor: 'rgba(0,198,255,0.15)', background: 'rgba(0,198,255,0.04)' }}>
        <RefreshCw size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-cyan-400">How this works</p>
          <p className="text-xs text-slate-400 mt-0.5">
            This page mints an avatar session token (LITE mode) directly from the browser using your Avatars API key,
            then streams the avatar driven by the selected agent over LiveKit. All config — API keys, agent, avatar,
            and the optional workflow webhook — comes from Ellux's Settings and saved Webhooks, making Ellux the master config for
            this demo.{' '}
            <a href="https://docs.liveavatar.com" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1">
              Docs <ExternalLink size={10} />
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
