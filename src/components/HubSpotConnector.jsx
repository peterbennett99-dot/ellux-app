import { useState, useEffect } from 'react';
import {
  RefreshCw, Plus, X, CheckCircle2, XCircle, User,
  MessageSquare, Link2, LogOut,
} from 'lucide-react';
import { elevenLabs, hubspot } from '../lib/api';
import { useApp } from '../lib/store';
import { extractContactInfo, splitName } from '../lib/contactInfo';

function CreateContactPanel({ open, onClose }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [saving, setSaving] = useState(false);
  const { showToast } = useApp();

  async function handleSubmit() {
    if (!email.trim() && !phone.trim()) { showToast('Email or phone is required', 'error'); return; }
    setSaving(true);
    try {
      const properties = {
        firstname: firstName.trim() || undefined,
        lastname: lastName.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        company: company.trim() || undefined,
      };
      await hubspot.createContact(properties);
      const fullName = `${firstName} ${lastName}`.trim() || email.trim();
      showToast(`Contact "${fullName}" created in HubSpot`, 'success');
      setFirstName(''); setLastName(''); setEmail(''); setPhone(''); setCompany('');
      onClose?.();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="glass-card rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plus size={16} className="text-cyan-400" />
          <p className="text-sm font-semibold text-white">Create Contact</p>
        </div>
        <button onClick={onClose} className="btn-ghost" style={{ padding: '6px' }}>
          <X size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1">First Name</label>
          <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jane" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1">Last Name</label>
          <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1">Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1">Phone</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555 123 4567" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-slate-400 block mb-1">Company</label>
          <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Inc." />
        </div>
      </div>

      <button onClick={handleSubmit} disabled={saving} className="btn-primary w-full justify-center">
        <Plus size={14} />
        {saving ? 'Creating…' : 'Create Contact'}
      </button>
    </div>
  );
}

function ConversationSyncCard({ conv, synced, syncing, onSync }) {
  const info = extractContactInfo(conv);
  const date = conv.start_time_unix_secs ?? conv.metadata?.start_time_unix_secs;

  return (
    <div className="glass-card rounded-xl p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,122,89,0.12)' }}>
        <MessageSquare size={14} className="text-orange-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono text-slate-400 truncate">{conv.conversation_id}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-slate-500">
          {info.name && <span className="flex items-center gap-1"><User size={10} />{info.name}</span>}
          {info.email && <span>{info.email}</span>}
          {info.phone && <span>{info.phone}</span>}
          {date && <span>{new Date(date * 1000).toLocaleDateString()}</span>}
          {!info.name && !info.email && !info.phone && <span className="text-slate-600">No contact details captured</span>}
        </div>
      </div>
      {synced ? (
        <span className="badge badge-green flex-shrink-0"><CheckCircle2 size={10} /> Synced</span>
      ) : (
        <button onClick={() => onSync(conv)} disabled={syncing} className="btn-ghost flex-shrink-0">
          {syncing ? <RefreshCw size={12} className="animate-spin" /> : <Link2 size={12} />}
          {syncing ? 'Syncing…' : 'Sync'}
        </button>
      )}
    </div>
  );
}

// HubSpot connection (private app access token), contact creation, and
// conversation sync — embedded as the contents of the HubSpot widget on Settings.
export default function HubSpotConnector() {
  const { showToast } = useApp();
  const [connected, setConnected] = useState(hubspot.isConnected());
  const [testing, setTesting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncedIds, setSyncedIds] = useState(new Set());
  const [syncingId, setSyncingId] = useState(null);

  async function loadConversations() {
    setLoading(true);
    try {
      const data = await elevenLabs.getConversations();
      setConversations(data.conversations || []);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadConversations(); }, []);

  async function handleTest() {
    setTesting(true);
    try {
      await hubspot.testConnection();
      setConnected(true);
      showToast('Connected to HubSpot', 'success');
    } catch (e) {
      setConnected(false);
      showToast(e.message, 'error');
    } finally {
      setTesting(false);
    }
  }

  function handleDisconnect() {
    hubspot.disconnect();
    setConnected(false);
    showToast('Disconnected from HubSpot', 'info');
  }

  // Syncs a conversation to HubSpot: finds or creates a contact from the
  // captured details, then logs the conversation as a Note on that contact.
  async function handleSync(conv) {
    setSyncingId(conv.conversation_id);
    try {
      const detail = await elevenLabs.getConversation(conv.conversation_id);
      const info = extractContactInfo(detail);
      const { first, last } = splitName(info.name);

      let contactId = null;
      if (info.email) {
        const existing = await hubspot.findContactByEmail(info.email);
        contactId = existing?.id || null;
      }
      if (!contactId && info.phone) {
        const existing = await hubspot.findContactByPhone(info.phone);
        contactId = existing?.id || null;
      }

      if (!contactId) {
        const contact = await hubspot.createContact({
          firstname: first || undefined,
          lastname: last || 'AI Conversation Contact',
          email: info.email || undefined,
          phone: info.phone || undefined,
        });
        contactId = contact.id;
      }

      const summary = detail.analysis?.transcript_summary || 'No summary available.';
      await hubspot.createNoteForContact(contactId, `AI Conversation — ${conv.conversation_id}\n\n${summary}`);

      setSyncedIds(s => new Set([...s, conv.conversation_id]));
      showToast('Conversation synced to HubSpot', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSyncingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 flex-wrap">
        {connected && (
          <button onClick={handleDisconnect} className="btn-ghost">
            <LogOut size={14} />
            Disconnect
          </button>
        )}
        <button onClick={handleTest} disabled={testing} className="btn-ghost">
          {testing ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Test Connection
        </button>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
          <User size={14} />
          CONTACTS
        </h3>
        <button onClick={() => setShowCreate(v => !v)} className={showCreate ? 'btn-primary' : 'btn-ghost'}>
          <Plus size={14} />
          New Contact
        </button>
      </div>

      <CreateContactPanel open={showCreate} onClose={() => setShowCreate(false)} />

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
          <MessageSquare size={14} />
          CONVERSATION SYNC
        </h3>
        <button onClick={loadConversations} disabled={loading} className="btn-ghost">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
          Loading conversations…
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <XCircle size={32} className="mx-auto mb-3 opacity-30" />
          No conversations found. Check your API key above.
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map(c => (
            <ConversationSyncCard
              key={c.conversation_id}
              conv={c}
              synced={syncedIds.has(c.conversation_id)}
              syncing={syncingId === c.conversation_id}
              onSync={handleSync}
            />
          ))}
        </div>
      )}
    </div>
  );
}
