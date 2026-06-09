import { useState, useEffect, useRef } from 'react';
import { Video, Upload, RefreshCw, Plus, Image, ChevronDown, ChevronUp, X, Check } from 'lucide-react';
import { heyGen } from '../lib/api';
import { useApp } from '../lib/store';

function UploadZone({ onUpload }) {
  const [drag, setDrag] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [name, setName] = useState('');
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();
  const { showToast } = useApp();

  function handleFile(f) {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setName(f.name.replace(/\.[^.]+$/, ''));
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    try {
      const res = await heyGen.uploadAvatarPhoto(file);
      if (res.data?.url || res.url) {
        const photoUrl = res.data?.url || res.url;
        await heyGen.createPhotoAvatar({ name: name || file.name, image_key: res.data?.image_key || res.image_key });
        showToast('Avatar uploaded successfully!', 'success');
        setFile(null); setPreview(null); setName('');
        onUpload?.();
      }
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="glass-card rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
        <Upload size={15} className="text-cyan-400" />
        Upload New Avatar
      </h3>

      {preview ? (
        <div className="relative">
          <img src={preview} alt="preview" className="w-full h-40 object-cover rounded-lg" />
          <button
            onClick={() => { setFile(null); setPreview(null); }}
            className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.7)' }}
          >
            <X size={12} className="text-white" />
          </button>
        </div>
      ) : (
        <div
          className={`upload-zone p-8 text-center cursor-pointer ${drag ? 'drag-over' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
        >
          <Image size={28} className="mx-auto mb-2 text-slate-600" />
          <p className="text-sm text-slate-400">Drop image here or <span className="text-cyan-400">browse</span></p>
          <p className="text-xs text-slate-600 mt-1">PNG, JPG — max 10MB</p>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
        </div>
      )}

      {file && (
        <>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Avatar Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="My Avatar" />
          </div>
          <button onClick={handleUpload} disabled={uploading} className="btn-primary w-full justify-center">
            <Upload size={14} />
            {uploading ? 'Uploading…' : 'Upload & Create Avatar'}
          </button>
        </>
      )}
    </div>
  );
}

function AvatarCard({ avatar }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 p-4 text-left">
        {avatar.preview_image_url ? (
          <img src={avatar.preview_image_url} alt={avatar.avatar_name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(0,198,255,0.12)' }}>
            <Video size={16} className="text-cyan-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{avatar.avatar_name || avatar.avatar_id}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="badge badge-blue">{avatar.gender || 'unknown'}</span>
            {avatar.is_public && <span className="badge badge-green">public</span>}
          </div>
        </div>
        {open ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
      </button>

      {open && (
        <div className="px-4 pb-4 border-t space-y-2" style={{ borderColor: 'rgba(0,198,255,0.08)' }}>
          <div className="pt-3">
            <p className="text-xs text-slate-500">Avatar ID</p>
            <p className="text-xs font-mono text-slate-300 mt-0.5">{avatar.avatar_id}</p>
          </div>
          {avatar.preview_video_url && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Preview</p>
              <video
                src={avatar.preview_video_url}
                controls
                className="w-full rounded-lg"
                style={{ maxHeight: 200 }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StreamingAvatarCard({ avatar }) {
  const [open, setOpen] = useState(false);
  const { showToast } = useApp();

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 p-4 text-left">
        <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.2)' }}>
          <Video size={16} className="text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{avatar.avatar_name || avatar.avatar_id}</p>
          <span className="badge badge-purple">Live Avatar</span>
        </div>
        {open ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
      </button>

      {open && (
        <div className="px-4 pb-4 border-t space-y-3" style={{ borderColor: 'rgba(0,198,255,0.08)' }}>
          <div className="pt-3 space-y-2">
            <div>
              <p className="text-xs text-slate-500">Avatar ID</p>
              <p className="text-xs font-mono text-slate-300">{avatar.avatar_id}</p>
            </div>
            {avatar.preview_image_url && (
              <img src={avatar.preview_image_url} alt="" className="w-full h-32 object-cover rounded-lg" />
            )}
          </div>
          <button
            onClick={async () => {
              try {
                await heyGen.createStreamingSession({ avatar_id: avatar.avatar_id, quality: 'medium' });
                showToast('Streaming session started!', 'success');
              } catch (e) {
                showToast(e.message, 'error');
              }
            }}
            className="btn-primary w-full justify-center"
          >
            <Video size={14} />
            Start Streaming Session
          </button>
        </div>
      )}
    </div>
  );
}

export default function HgAvatars() {
  const [tab, setTab] = useState('library');
  const [avatars, setAvatars] = useState([]);
  const [streaming, setStreaming] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useApp();

  async function load() {
    setLoading(true);
    try {
      const [av, st] = await Promise.allSettled([
        heyGen.getAvatars(),
        heyGen.getStreamingAvatars(),
      ]);
      if (av.status === 'fulfilled') setAvatars(av.value.data?.avatars || av.value.avatars || []);
      if (st.status === 'fulfilled') setStreaming(st.value.data?.list || st.value.list || []);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const tabs = [
    { id: 'library', label: 'Avatar Library' },
    { id: 'streaming', label: 'Live Avatars' },
    { id: 'upload', label: 'Upload' },
  ];

  return (
    <div className="fade-in p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">HeyGen Avatars</h1>
          <p className="text-sm text-slate-500 mt-1">Manage live avatars & upload new ones</p>
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

      {loading ? (
        <div className="text-center py-12 text-slate-500">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
          Loading avatars…
        </div>
      ) : tab === 'upload' ? (
        <UploadZone onUpload={load} />
      ) : tab === 'library' ? (
        avatars.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Video size={32} className="mx-auto mb-3 opacity-30" />
            No avatars found. Check your API key in Settings.
          </div>
        ) : (
          <div className="space-y-3">
            {avatars.map(a => <AvatarCard key={a.avatar_id} avatar={a} />)}
          </div>
        )
      ) : (
        streaming.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Video size={32} className="mx-auto mb-3 opacity-30" />
            No streaming avatars found.
          </div>
        ) : (
          <div className="space-y-3">
            {streaming.map(a => <StreamingAvatarCard key={a.avatar_id} avatar={a} />)}
          </div>
        )
      )}
    </div>
  );
}
