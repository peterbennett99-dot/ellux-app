import { useState, useEffect } from 'react';
import {
  Cloud, RefreshCw, Plus, X, CheckCircle2, XCircle, User, Briefcase,
  MessageSquare, Link2, ExternalLink, Wifi, WifiOff, LogIn, LogOut, Copy, Check,
} from 'lucide-react';
import { elevenLabs, salesforce } from '../lib/api';
import { useApp } from '../lib/store';

// The Connected App's "Callback URL" must match this exactly.
function getRedirectUri() {
  return `${window.location.origin}${window.location.pathname}`;
}

// Pulls likely contact details (name/email/phone) out of a conversation's
// dynamic variables and data-collection results — agents vary in what they
// capture, so we scan by key pattern rather than a fixed schema.
function extractContactInfo(conv) {
  const vars = conv.conversation_initiation_client_data?.dynamic_variables || {};
  const collected = conv.analysis?.data_collection_results || {};

  const find = (re) => {
    for (const [k, v] of Object.entries(vars)) {
      if (re.test(k) && v) return String(v);
    }
    for (const [k, v] of Object.entries(collected)) {
      const val = v?.value ?? v;
      if (re.test(k) && val) return String(val);
    }
    return '';
  };

  return {
    name: find(/name/i),
    email: find(/email/i),
    phone: find(/phone|number|mobile/i) || conv.metadata?.phone_call?.external_number || '',
  };
}

function splitName(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: '', last: '' };
  if (parts.length === 1) return { first: '', last: parts[0] };
  return { first: parts.slice(0, -1).join(' '), last: parts[parts.length - 1] };
}

function CreateContactPanel({ open, onClose }) {
  const [type, setType] = useState('contact'); // 'contact' | 'lead'
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [saving, setSaving] = useState(false);
  const { showToast } = useApp();

  async function handleSubmit() {
    if (!lastName.trim()) { showToast('Last name is required', 'error'); return; }
    if (type === 'lead' && !company.trim()) { showToast('Company is required for a prospect (Lead)', 'error'); return; }
    setSaving(true);
    try {
      const fields = {
        FirstName: firstName.trim() || undefined,
        LastName: lastName.trim(),
        Email: email.trim() || undefined,
        Phone: phone.trim() || undefined,
      };
      const fullName = `${firstName} ${lastName}`.trim();
      if (type === 'lead') {
        fields.Company = company.trim();
        fields.LeadSource = 'Ellux';
        await salesforce.createLead(fields);
        showToast(`Prospect "${fullName}" created in Salesforce`, 'success');
      } else {
        if (company.trim()) fields.Description = `Company: ${company.trim()}`;
        await salesforce.createContact(fields);
        showToast(`Contact "${fullName}" created in Salesforce`, 'success');
      }
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
          <p className="text-sm font-semibold text-white">Create Contact / Prospect</p>
        </div>
        <button onClick={onClose} className="btn-ghost" style={{ padding: '6px' }}>
          <X size={14} />
        </button>
      </div>

      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)' }}>
        {[
          { id: 'contact', label: 'Contact' },
          { id: 'lead', label: 'Prospect (Lead)' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setType(t.id)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${type === t.id ? 'tab-active' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {t.label}
          </button>
        ))}
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
          <label className="text-xs font-medium text-slate-400 block mb-1">
            Company {type === 'lead' && <span className="text-slate-600">(required)</span>}
          </label>
          <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Inc." />
        </div>
      </div>

      <button onClick={handleSubmit} disabled={saving} className="btn-primary w-full justify-center">
        <Plus size={14} />
        {saving ? 'Creating…' : type === 'lead' ? 'Create Prospect' : 'Create Contact'}
      </button>
    </div>
  );
}

function ConversationSyncCard({ conv, synced, syncing, onSync }) {
  const info = extractContactInfo(conv);
  const date = conv.start_time_unix_secs ?? conv.metadata?.start_time_unix_secs;

  return (
    <div className="glass-card rounded-xl p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16,185,129,0.12)' }}>
        <MessageSquare size={14} className="text-green-400" />
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

export default function Salesforce() {
  const { showToast } = useApp();
  const [connected, setConnected] = useState(salesforce.isConnected());
  const [testing, setTesting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [copied, setCopied] = useState(false);
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

  // Completes the SSO redirect: if the URL carries an OAuth `code`, exchange
  // it for tokens and clean the query string out of the address bar.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const errorParam = params.get('error');
    if (!code && !errorParam) return;

    if (errorParam) {
      showToast(`Salesforce SSO error: ${params.get('error_description') || errorParam}`, 'error');
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    (async () => {
      setSsoLoading(true);
      try {
        await salesforce.exchangeCodeForToken({
          code,
          state: params.get('state'),
          clientId: localStorage.getItem('sf_client_id') || '',
          loginUrl: localStorage.getItem('sf_login_url') || 'https://login.salesforce.com',
          redirectUri: getRedirectUri(),
        });
        setConnected(true);
        showToast('Signed in to Salesforce', 'success');
      } catch (e) {
        showToast(e.message, 'error');
      } finally {
        setSsoLoading(false);
        window.history.replaceState({}, '', window.location.pathname);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSsoLogin() {
    const clientId = localStorage.getItem('sf_client_id') || '';
    if (!clientId) {
      showToast('Add your Connected App Consumer Key (sf_client_id) in Settings first', 'error');
      return;
    }
    setSsoLoading(true);
    try {
      const url = await salesforce.getAuthorizeUrl({
        clientId,
        loginUrl: localStorage.getItem('sf_login_url') || 'https://login.salesforce.com',
        redirectUri: getRedirectUri(),
      });
      window.location.href = url;
    } catch (e) {
      showToast(e.message, 'error');
      setSsoLoading(false);
    }
  }

  function handleDisconnect() {
    salesforce.disconnect();
    setConnected(false);
    showToast('Disconnected from Salesforce', 'info');
  }

  function copyRedirectUri() {
    navigator.clipboard.writeText(getRedirectUri());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleTest() {
    setTesting(true);
    try {
      await salesforce.testConnection();
      setConnected(true);
      showToast('Connected to Salesforce', 'success');
    } catch (e) {
      setConnected(false);
      showToast(e.message, 'error');
    } finally {
      setTesting(false);
    }
  }

  async function handleConnect() {
    setConnecting(true);
    try {
      await salesforce.authenticate({
        clientId: localStorage.getItem('sf_client_id') || '',
        clientSecret: localStorage.getItem('sf_client_secret') || '',
        username: localStorage.getItem('sf_username') || '',
        password: localStorage.getItem('sf_password') || '',
      });
      setConnected(true);
      showToast('Connected to Salesforce', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setConnecting(false);
    }
  }

  async function handleSync(conv) {
    setSyncingId(conv.conversation_id);
    try {
      const detail = await elevenLabs.getConversation(conv.conversation_id);
      const info = extractContactInfo(detail);
      const { first, last } = splitName(info.name);

      let whoId = null;
      if (info.email) {
        const existing = await salesforce.findContactByEmail(info.email) || await salesforce.findLeadByEmail(info.email);
        whoId = existing?.Id || null;
      }
      if (!whoId && info.phone) {
        const existing = await salesforce.findContactByPhone(info.phone) || await salesforce.findLeadByPhone(info.phone);
        whoId = existing?.Id || null;
      }

      if (!whoId) {
        const lead = await salesforce.createLead({
          FirstName: first || undefined,
          LastName: last || 'AI Conversation Contact',
          Email: info.email || undefined,
          Phone: info.phone || undefined,
          Company: 'Unknown (from AI conversation)',
          LeadSource: 'Ellux AI Conversation',
        });
        whoId = lead.id;
      }

      const startSecs = detail.start_time_unix_secs ?? detail.metadata?.start_time_unix_secs;
      await salesforce.createTask({
        Subject: `AI Conversation — ${conv.conversation_id}`,
        Description: detail.analysis?.transcript_summary || 'No summary available.',
        Status: 'Completed',
        ActivityDate: new Date((startSecs ? startSecs * 1000 : Date.now())).toISOString().slice(0, 10),
        WhoId: whoId,
      });

      setSyncedIds(s => new Set([...s, conv.conversation_id]));
      showToast('Conversation synced to Salesforce', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSyncingId(null);
    }
  }

  return (
    <div className="fade-in p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Cloud size={20} className="text-green-400" />
            Salesforce
          </h1>
          <p className="text-sm text-slate-500 mt-1">Sync conversations and manage contacts &amp; prospects in Salesforce</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge ${connected ? 'badge-green' : 'badge-red'}`}>
            {connected ? <Wifi size={10} /> : <WifiOff size={10} />}
            {connected ? 'Connected' : 'Not connected'}
          </span>
          {connected ? (
            <button onClick={handleDisconnect} className="btn-ghost">
              <LogOut size={14} />
              Disconnect
            </button>
          ) : (
            <button onClick={handleSsoLogin} disabled={ssoLoading} className="btn-primary">
              {ssoLoading ? <RefreshCw size={14} className="animate-spin" /> : <LogIn size={14} />}
              {ssoLoading ? 'Signing in…' : 'Sign in with Salesforce'}
            </button>
          )}
          <button onClick={handleConnect} disabled={connecting} className="btn-ghost">
            {connecting ? <RefreshCw size={14} className="animate-spin" /> : <Link2 size={14} />}
            {connecting ? 'Connecting…' : 'Connect'}
          </button>
          <button onClick={handleTest} disabled={testing} className="btn-ghost">
            {testing ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Test Connection
          </button>
        </div>
      </div>

      {!connected && (
        <div className="glass rounded-xl p-4 flex gap-3" style={{ borderColor: 'rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.05)' }}>
          <Briefcase size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-400 space-y-2">
            <p>
              <strong className="text-slate-300">Sign in with Salesforce</strong> uses SSO (OAuth Authorization Code + PKCE) —
              add your Connected App's Consumer Key as <code>sf_client_id</code> (and Login URL, if not production) in{' '}
              <strong className="text-slate-300">Settings</strong>, then register this app's callback URL on the Connected App:
            </p>
            <div className="flex items-center gap-2">
              <code className="px-2 py-1 rounded-lg break-all" style={{ background: 'rgba(0,0,0,0.4)' }}>{getRedirectUri()}</code>
              <button onClick={copyRedirectUri} className="btn-ghost flex-shrink-0" style={{ padding: '6px' }}>
                {copied ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
            <p>
              Alternatively, paste a Salesforce Instance URL and Access Token directly in Settings, or fill in the
              username/password Connect fields and click "Connect" above.{' '}
              <a href="https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1">
                Docs <ExternalLink size={10} />
              </a>
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
          <User size={14} />
          CONTACTS &amp; PROSPECTS
        </h2>
        <button onClick={() => setShowCreate(v => !v)} className={showCreate ? 'btn-primary' : 'btn-ghost'}>
          <Plus size={14} />
          New Contact / Prospect
        </button>
      </div>

      <CreateContactPanel open={showCreate} onClose={() => setShowCreate(false)} />

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
          <MessageSquare size={14} />
          CONVERSATION SYNC
        </h2>
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
          No conversations found. Check your API key in Settings.
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
