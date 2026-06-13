import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, RefreshCw, ChevronDown, ChevronUp, Plus, Trash2,
  FileText, Link as LinkIcon, Upload, Bot, Link2, Unlink, Folder,
} from 'lucide-react';
import { elevenLabs } from '../lib/api';
import { useApp } from '../lib/store';

const TYPE_BADGE = { file: 'badge-blue', url: 'badge-purple', text: 'badge-amber', folder: 'badge-green' };

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function AddDocumentPanel({ onCreated }) {
  const [mode, setMode] = useState('text');
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const { showToast } = useApp();

  async function handleSubmit() {
    setSaving(true);
    try {
      let doc;
      if (mode === 'text') {
        if (!text.trim()) throw new Error('Enter some text content');
        doc = await elevenLabs.createKnowledgeBaseFromText(text, name);
      } else if (mode === 'url') {
        if (!url.trim()) throw new Error('Enter a URL');
        doc = await elevenLabs.createKnowledgeBaseFromUrl(url, name);
      } else {
        if (!file) throw new Error('Choose a file to upload');
        doc = await elevenLabs.createKnowledgeBaseFromFile(file, name);
      }
      showToast('Document added to knowledge base', 'success');
      setName(''); setText(''); setUrl(''); setFile(null);
      onCreated?.(doc);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="glass-card rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Plus size={16} className="text-cyan-400" />
        <p className="text-sm font-semibold text-white">Add Document</p>
      </div>

      <div className="flex gap-2">
        {[
          { id: 'text', label: 'Text', icon: FileText },
          { id: 'url', label: 'URL', icon: LinkIcon },
          { id: 'file', label: 'File', icon: Upload },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setMode(t.id)}
              className={`btn-ghost ${mode === t.id ? 'tab-active' : ''}`}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div>
        <label className="text-xs font-medium text-slate-400 block mb-1">Name (optional)</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="My document" />
      </div>

      {mode === 'text' && (
        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1">Text Content</label>
          <textarea
            rows={5}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste or type the content to add…"
            style={{ resize: 'vertical', minHeight: '100px' }}
          />
        </div>
      )}

      {mode === 'url' && (
        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1">URL</label>
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/page" />
        </div>
      )}

      {mode === 'file' && (
        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1">File</label>
          <div className="upload-zone rounded-lg p-4 text-center">
            <input
              type="file"
              id="kb-file-input"
              className="hidden"
              onChange={e => setFile(e.target.files?.[0] || null)}
              style={{ display: 'none' }}
            />
            <label htmlFor="kb-file-input" className="cursor-pointer">
              <Upload size={20} className="mx-auto mb-2 text-cyan-400" />
              <p className="text-sm text-slate-300">{file ? file.name : 'Click to choose a file'}</p>
            </label>
          </div>
        </div>
      )}

      <button onClick={handleSubmit} disabled={saving} className="btn-primary w-full justify-center">
        <Plus size={14} />
        {saving ? 'Uploading…' : 'Add to Knowledge Base'}
      </button>
    </div>
  );
}

function DocumentCard({ doc, onDeleted, selectedAgent, attached, onToggleAttach, attaching }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useApp();

  async function toggleOpen() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (detail) return;
    setLoading(true);
    try {
      const d = await elevenLabs.getKnowledgeBaseDocument(doc.id);
      setDetail(d);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(e) {
    e.stopPropagation();
    if (!confirm(`Delete "${doc.name || doc.id}" from the knowledge base?`)) return;
    setDeleting(true);
    try {
      await elevenLabs.deleteKnowledgeBaseDocument(doc.id);
      showToast('Document deleted', 'success');
      onDeleted?.(doc.id);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setDeleting(false);
    }
  }

  const dependentAgents = detail?.dependent_agents || doc.dependent_agents || [];

  return (
    <div className="glass-card rounded-xl overflow-hidden flex flex-col">
      <div
        role="button"
        tabIndex={0}
        onClick={toggleOpen}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleOpen(); }}
        className="w-full flex flex-col items-center text-center gap-2 p-5 cursor-pointer relative"
      >
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="btn-ghost"
          title="Delete document"
          style={{ padding: '6px 10px', position: 'absolute', top: '12px', right: '12px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
        >
          <Trash2 size={13} />
        </button>
        <div className="w-16 h-16 rounded-full accent-gradient flex items-center justify-center flex-shrink-0">
          {doc.type === 'folder' ? <Folder size={24} className="text-white" /> : <BookOpen size={24} className="text-white" />}
        </div>
        <p className="text-sm font-semibold text-white truncate w-full">{doc.name || doc.id}</p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className={`badge ${TYPE_BADGE[doc.type] || 'badge-blue'}`}>{doc.type || 'document'}</span>
          {dependentAgents.length > 0 && <span className="badge badge-green">{dependentAgents.length} agent{dependentAgents.length > 1 ? 's' : ''}</span>}
          {attached && <span className="badge badge-purple">Attached</span>}
        </div>
        {open ? <ChevronUp size={16} className="text-slate-500 flex-shrink-0" /> : <ChevronDown size={16} className="text-slate-500 flex-shrink-0" />}
      </div>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: 'rgba(0,198,255,0.08)' }}>
          <div className="pt-3 space-y-2">
            <p className="text-xs text-slate-500 font-mono break-all">{doc.id}</p>

            {loading ? (
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <RefreshCw size={12} className="animate-spin" /> Loading content…
              </div>
            ) : detail ? (
              <div>
                {doc.type === 'url' && detail.url && (
                  <p className="text-xs text-cyan-400 break-all mb-1">{detail.url}</p>
                )}
                {detail.extracted_inner_html && (
                  <div className="text-xs text-slate-400 max-h-32 overflow-y-auto rounded-lg p-2" style={{ background: 'rgba(8,11,20,0.6)' }}>
                    {stripHtml(detail.extracted_inner_html).slice(0, 800) || 'No preview available.'}
                  </div>
                )}
              </div>
            ) : null}

            {dependentAgents.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-400 mb-1">Used by agents</p>
                <div className="flex flex-wrap gap-1.5">
                  {dependentAgents.map(a => (
                    <span key={a.id || a.agent_id} className="badge badge-green">
                      <Bot size={10} /> {a.name || a.id || a.agent_id}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {selectedAgent ? (
            <button
              onClick={() => onToggleAttach(doc)}
              disabled={attaching}
              className={attached ? 'btn-danger w-full justify-center' : 'btn-primary w-full justify-center'}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {attached ? <Unlink size={14} /> : <Link2 size={14} />}
              {attaching ? 'Updating…' : attached ? `Detach from "${selectedAgent.name}"` : `Attach to "${selectedAgent.name}"`}
            </button>
          ) : (
            <p className="text-xs text-slate-500 text-center">Select an agent on the Agents page to attach documents.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function XiKnowledgeBase() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState([]);
  const [targetAgentId, setTargetAgentId] = useState('');
  const [attachedIds, setAttachedIds] = useState(new Set());
  const [attachingId, setAttachingId] = useState(null);
  const { showToast, selectedAgent } = useApp();

  const targetAgent = (() => {
    const a = agents.find(a => a.agent_id === targetAgentId);
    return a ? { id: a.agent_id, name: a.name || 'Unnamed Agent' } : null;
  })();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await elevenLabs.getKnowledgeBaseList();
      setDocuments(data.documents || data.items || []);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
    elevenLabs.getAgents().then(d => {
      const list = d.agents || [];
      setAgents(list);
      const initial = selectedAgent?.id && list.some(a => a.agent_id === selectedAgent.id)
        ? selectedAgent.id
        : list[0]?.agent_id || '';
      setTargetAgentId(initial);
    }).catch(() => {});
  }, [load]);

  const loadAttached = useCallback(async () => {
    if (!targetAgent) { setAttachedIds(new Set()); return; }
    try {
      const agent = await elevenLabs.getAgent(targetAgent.id);
      const kb = agent.conversation_config?.agent?.prompt?.knowledge_base || [];
      setAttachedIds(new Set(kb.map(d => d.id)));
    } catch {
      setAttachedIds(new Set());
    }
  }, [targetAgent?.id]);

  useEffect(() => { loadAttached(); }, [loadAttached]);

  async function handleToggleAttach(doc) {
    if (!targetAgent) return;
    setAttachingId(doc.id);
    try {
      const agent = await elevenLabs.getAgent(targetAgent.id);
      const kb = agent.conversation_config?.agent?.prompt?.knowledge_base || [];
      const isAttached = kb.some(d => d.id === doc.id);
      const nextKb = isAttached
        ? kb.filter(d => d.id !== doc.id)
        : [...kb, { type: doc.type, name: doc.name, id: doc.id }];

      await elevenLabs.updateAgent(targetAgent.id, {
        conversation_config: {
          ...agent.conversation_config,
          agent: {
            ...agent.conversation_config.agent,
            prompt: { ...agent.conversation_config.agent.prompt, knowledge_base: nextKb },
          },
        },
      });

      setAttachedIds(new Set(nextKb.map(d => d.id)));
      showToast(isAttached ? `Detached from "${targetAgent.name}"` : `Attached to "${targetAgent.name}"`, 'success');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setAttachingId(null);
    }
  }

  function handleCreated(doc) {
    if (doc?.id) setDocuments(list => [doc, ...list]);
    else load();
  }

  function handleDeleted(id) {
    setDocuments(list => list.filter(d => d.id !== id));
  }

  return (
    <div className="fade-in p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Knowledge Base</h1>
          <p className="text-sm text-slate-500 mt-1">Manage documents for your conversational AI agents</p>
        </div>
        <button onClick={load} disabled={loading} className="btn-ghost">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="glass-card rounded-xl p-3 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-slate-300 flex-shrink-0">
          <Bot size={14} className="text-purple-400" />
          Configure knowledge base for
        </div>
        {agents.length === 0 ? (
          <span className="text-sm text-slate-500">No agents found. Check your API key in Settings.</span>
        ) : (
          <select
            value={targetAgentId}
            onChange={e => setTargetAgentId(e.target.value)}
            style={{ maxWidth: '280px' }}
          >
            {agents.map(a => (
              <option key={a.agent_id} value={a.agent_id}>{a.name || a.agent_id}</option>
            ))}
          </select>
        )}
      </div>

      <AddDocumentPanel onCreated={handleCreated} />

      {loading ? (
        <div className="text-center py-12 text-slate-500">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
          Loading documents…
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
          No knowledge base documents yet. Add one above.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          {documents.map(doc => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onDeleted={handleDeleted}
              selectedAgent={targetAgent}
              attached={attachedIds.has(doc.id)}
              attaching={attachingId === doc.id}
              onToggleAttach={handleToggleAttach}
            />
          ))}
        </div>
      )}
    </div>
  );
}
