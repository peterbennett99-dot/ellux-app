import { useState, useEffect, useRef } from 'react';
import {
  LiveAvatarSession, SessionEvent, SessionState, AgentEventsEnum,
} from '@heygen/liveavatar-web-sdk';
import { Play, Square, Mic, MicOff, Sparkles, X, Maximize2, Minimize2 } from 'lucide-react';
import { liveAvatar, elevenLabs } from '../lib/api';

const SANDBOX_AVATAR_ID = 'dd73ea75-1218-4ef3-92ce-606d5f7fbc0a'; // "Wayne" — sandbox-only avatar

function postResize(expanded) {
  window.parent.postMessage({ source: 'ellux-embed', type: 'resize', expanded }, '*');
}

export default function EmbedAvatar() {
  const params = new URLSearchParams(window.location.search);
  const agentId = params.get('agent') || '';
  const avatarParam = params.get('avatar') || '';
  const secretId = params.get('secret') || '';
  const voiceId = params.get('voice') || '';
  const accent = params.get('accent') ? `#${params.get('accent').replace(/^#/, '')}` : '#00c6ff';
  const name = params.get('name') || 'AI Assistant';
  const autostart = params.get('autostart') === '1';
  const launcher = params.get('launcher') === '1';
  const allowFullscreen = params.get('fullscreen') === '1';
  const sandbox = !avatarParam || avatarParam === 'sandbox';
  const avatarId = sandbox ? SANDBOX_AVATAR_ID : avatarParam;

  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const sessionRef = useRef(null);

  const [open, setOpen] = useState(!launcher);
  const [state, setState] = useState(SessionState.INACTIVE);
  const [live, setLive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    document.body.style.background = 'transparent';
    document.documentElement.style.background = 'transparent';
    return () => { sessionRef.current?.stop(); };
  }, []);

  useEffect(() => {
    function onChange() { setFullscreen(!!document.fullscreenElement); }
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  useEffect(() => {
    if (autostart && (!launcher || open)) startSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function expand() {
    setOpen(true);
    postResize(true);
  }

  function collapse() {
    sessionRef.current?.stop();
    sessionRef.current = null;
    setLive(false);
    setListening(false);
    setState(SessionState.INACTIVE);
    setOpen(false);
    postResize(false);
  }

  async function startSession() {
    if (!agentId || !secretId) {
      setError('This embed is missing required configuration (agent or secret).');
      return;
    }
    setStarting(true);
    setError('');
    try {
      if (voiceId) {
        try {
          const detail = await elevenLabs.getAgent(agentId);
          if (detail.conversation_config?.tts?.voice_id !== voiceId) {
            await elevenLabs.updateAgent(agentId, {
              name: detail.name,
              conversation_config: {
                ...detail.conversation_config,
                tts: { ...detail.conversation_config?.tts, voice_id: voiceId },
              },
            });
          }
        } catch {
          // Non-fatal: continue with the agent's existing voice.
        }
      }

      const res = await liveAvatar.createSessionToken({
        mode: 'LITE',
        avatar_id: avatarId,
        is_sandbox: sandbox,
        elevenlabs_agent_config: { agent_id: agentId, secret_id: secretId },
      });
      const token = res.data?.session_token;
      if (!token) throw new Error('No session token returned');

      const session = new LiveAvatarSession(token, { voiceChat: true });
      sessionRef.current = session;

      session.on(SessionEvent.SESSION_STATE_CHANGED, s => setState(s));
      session.on(SessionEvent.SESSION_STREAM_READY, () => {
        if (videoRef.current) session.attach(videoRef.current);
        setLive(true);
      });
      session.on(SessionEvent.SESSION_DISCONNECTED, () => {
        setLive(false);
        setListening(false);
      });

      await session.start();
    } catch (e) {
      setError(e.message);
      setState(SessionState.INACTIVE);
    } finally {
      setStarting(false);
    }
  }

  function stopSession() {
    sessionRef.current?.stop();
    sessionRef.current = null;
    setLive(false);
    setListening(false);
    setState(SessionState.INACTIVE);
  }

  function toggleListening() {
    const session = sessionRef.current;
    if (!session) return;
    if (listening) { session.stopListening(); setListening(false); }
    else { session.startListening(); setListening(true); }
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current?.requestFullscreen?.();
    }
  }

  // Collapsed launcher bubble
  if (launcher && !open) {
    return (
      <button
        onClick={expand}
        className="flex items-center justify-center w-full h-full rounded-full"
        style={{ background: accent, border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.35)' }}
        title={name}
      >
        <Sparkles size={28} color="#fff" />
      </button>
    );
  }

  return (
    <div
      ref={containerRef}
      className={launcher ? 'glass-card rounded-2xl overflow-hidden flex flex-col h-full' : 'glass-card rounded-2xl overflow-hidden'}
      style={{ background: '#0b0f1a', border: '1px solid rgba(0,198,255,0.15)', position: 'relative' }}
    >
      {allowFullscreen && !launcher && (
        <button
          onClick={toggleFullscreen}
          className="btn-ghost"
          style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, padding: '6px' }}
          title={fullscreen ? 'Exit full screen' : 'Full screen'}
        >
          {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      )}
      {launcher && (
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(0,198,255,0.08)' }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: live ? '#10b981' : '#64748b' }} />
            <span className="text-sm font-semibold text-white">{name}</span>
          </div>
          <button onClick={collapse} className="btn-ghost" style={{ padding: '6px' }}>
            <X size={14} />
          </button>
        </div>
      )}

      <div className="relative flex-1" style={{ aspectRatio: launcher ? undefined : '16/9', background: '#000', minHeight: launcher ? 0 : undefined }}>
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        {!live && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
            {error ? (
              <p className="text-xs text-red-400">{error}</p>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `${accent}22` }}>
                  <Sparkles size={20} style={{ color: accent }} />
                </div>
                <p className="text-sm text-slate-300">{name}</p>
                <button
                  onClick={startSession}
                  disabled={starting}
                  className="btn-primary justify-center"
                  style={{ background: accent, border: 'none' }}
                >
                  <Play size={14} />
                  {starting ? 'Connecting…' : 'Start Conversation'}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {live && (
        <div className="p-3 flex items-center gap-2">
          <button onClick={toggleListening} className="btn-ghost">
            {listening ? <MicOff size={14} /> : <Mic size={14} />}
            {listening ? 'Mute' : 'Talk'}
          </button>
          <button onClick={stopSession} className="btn-danger ml-auto">
            <Square size={13} />
            End
          </button>
        </div>
      )}

      {!launcher && (
        <div className="px-3 py-2 text-center" style={{ borderTop: '1px solid rgba(0,198,255,0.08)' }}>
          <span className="text-xs text-slate-600">Powered by Ellux</span>
        </div>
      )}
    </div>
  );
}
