import { useState, useEffect } from 'react';
import { Video, RefreshCw, ChevronDown, ChevronUp, Play, ExternalLink, Square, Globe, User, Sparkles } from 'lucide-react';
import { liveAvatar } from '../lib/api';
import { useApp } from '../lib/store';

function AvatarCard({ avatar, onStartSession }) {
  const [open, setOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const { selectedAvatar, setSelectedAvatar } = useApp();
  const isSelected = selectedAvatar?.id === avatar.id;

  return (
    <div className={`glass-card rounded-xl overflow-hidden ${isSelected ? 'ring-2 ring-cyan-400' : ''}`}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(o => !o)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpen(o => !o); }}
        className="w-full flex items-center gap-3 p-4 text-left cursor-pointer"
      >
        {avatar.preview_url ? (
          <img src={avatar.preview_url} alt={avatar.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(0,198,255,0.12)' }}>
            <Video size={16} className="text-cyan-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{avatar.name || avatar.id}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {avatar.type && <span className="badge badge-blue">{avatar.type}</span>}
            {avatar.status && <span className={`badge ${avatar.status === 'ACTIVE' ? 'badge-green' : 'badge-amber'}`}>{avatar.status}</span>}
            {avatar.is_1080p && <span className="badge badge-purple">1080p</span>}
            {isSelected && <span className="badge badge-green">Selected for Demo</span>}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setSelectedAvatar({ id: avatar.id, name: avatar.name, preview_url: avatar.preview_url }); }}
          className={isSelected ? 'btn-primary' : 'btn-ghost'}
          title={isSelected ? 'Deselect for demo' : 'Use this avatar in the demo'}
          style={{ padding: '6px 10px' }}
        >
          <Sparkles size={13} />
        </button>
        {open ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
      </div>

      {open && (
        <div className="px-4 pb-4 border-t space-y-3" style={{ borderColor: 'rgba(0,198,255,0.08)' }}>
          <div className="pt-3 space-y-1">
            <p className="text-xs text-slate-500">Avatar ID</p>
            <p className="text-xs font-mono text-slate-300 break-all">{avatar.id}</p>
          </div>
          {avatar.default_voice?.name && (
            <div>
              <p className="text-xs text-slate-500">Default Voice</p>
              <p className="text-xs text-slate-300">{avatar.default_voice.name}</p>
            </div>
          )}
          {avatar.preview_url && (
            <img src={avatar.preview_url} alt="" className="w-full rounded-lg max-h-48 object-cover" />
          )}
          <button
            onClick={async () => {
              setStarting(true);
              try { await onStartSession(avatar); } finally { setStarting(false); }
            }}
            disabled={starting}
            className="btn-primary w-full justify-center"
          >
            <Play size={14} />
            {starting ? 'Starting…' : 'Start Live Session'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function LiveAvatars() {
  const [tab, setTab] = useState('library');
  const [avatars, setAvatars] = useState([]);
  const [publicAvatars, setPublicAvatars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const { showToast } = useApp();

  async function load() {
    setLoading(true);
    try {
      const [mine, pub] = await Promise.allSettled([
        liveAvatar.getAvatars(),
        liveAvatar.getPublicAvatars(),
      ]);
      if (mine.status === 'fulfilled') setAvatars(mine.value.data?.results || []);
      else showToast(mine.reason.message, 'error');
      if (pub.status === 'fulfilled') setPublicAvatars(pub.value.data?.results || []);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function startSession(avatar) {
    try {
      const res = await liveAvatar.createEmbed({
        avatar_id: avatar.id,
        context_id: crypto.randomUUID(),
        is_sandbox: false,
      });
      setSession({ avatar, ...res.data });
      setTab('session');
      showToast(`Live session started for "${avatar.name}"`, 'success');
    } catch (e) {
      showToast(e.message, 'error');
    }
  }

  const tabs = [
    { id: 'library', label: 'My Avatars' },
    { id: 'public', label: 'Public Library' },
    { id: 'session', label: 'Live Session' },
  ];

  return (
    <div className="fade-in p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Avatars</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and launch LiveAvatar sessions</p>
        </div>
        <button onClick={load} disabled={loading} className="btn-ghost">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${tab === t.id ? 'tab-active' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Note about avatar creation */}
      {tab === 'library' && (
        <div className="glass rounded-xl p-4 flex gap-3" style={{ borderColor: 'rgba(0,198,255,0.15)', background: 'rgba(0,198,255,0.04)' }}>
          <Globe size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-cyan-400">Creating new avatars</p>
            <p className="text-xs text-slate-400 mt-0.5">
              New avatars are created from the LiveAvatar dashboard.{' '}
              <a href="https://app.liveavatar.com/home" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline inline-flex items-center gap-1">
                Open dashboard <ExternalLink size={10} />
              </a>
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
          Loading avatars…
        </div>
      ) : tab === 'library' ? (
        avatars.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Video size={32} className="mx-auto mb-3 opacity-30" />
            No avatars found. Check your API key in Settings.
          </div>
        ) : (
          <div className="space-y-3">
            {avatars.map(a => <AvatarCard key={a.id} avatar={a} onStartSession={startSession} />)}
          </div>
        )
      ) : tab === 'public' ? (
        publicAvatars.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <User size={32} className="mx-auto mb-3 opacity-30" />
            No public avatars available.
          </div>
        ) : (
          <div className="space-y-3">
            {publicAvatars.map(a => <AvatarCard key={a.id} avatar={a} onStartSession={startSession} />)}
          </div>
        )
      ) : (
        // Live session tab
        session ? (
          <div className="glass-card rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              {session.avatar.preview_url && (
                <img src={session.avatar.preview_url} alt="" className="w-10 h-10 rounded-full object-cover" />
              )}
              <div>
                <p className="text-sm font-semibold text-white">{session.avatar.name}</p>
                <span className="badge badge-green">Live</span>
              </div>
              <button
                onClick={() => { setSession(null); showToast('Session closed', 'info'); }}
                className="btn-danger ml-auto"
              >
                <Square size={13} />
                End
              </button>
            </div>
            {session.url ? (
              <iframe
                src={session.url}
                title="LiveAvatar Session"
                className="w-full rounded-lg"
                style={{ aspectRatio: session.orientation === 'vertical' ? '9/16' : '16/9', border: 'none', minHeight: 320 }}
                allow="camera; microphone; autoplay"
              />
            ) : (
              <p className="text-xs text-slate-500">No embed URL returned.</p>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <Play size={32} className="mx-auto mb-3 opacity-30" />
            No active session. Start one from "My Avatars" or "Public Library".
          </div>
        )
      )}
    </div>
  );
}
