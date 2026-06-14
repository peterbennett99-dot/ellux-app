import { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, CheckCircle, ExternalLink, Key, Cloud, Wifi, WifiOff } from 'lucide-react';
import { useApp } from '../lib/store';
import ExpandableSection from '../components/ExpandableSection';
import SalesforceConnector from '../components/SalesforceConnector';
import { salesforce } from '../lib/api';

const API_KEY_SECTIONS = [
  {
    section: 'Agents',
    color: '#00c6ff',
    fields: [
      { key: 'xi_api_key', label: 'API Key', placeholder: 'sk-…', secret: true },
    ],
    docsUrl: 'https://elevenlabs.io/docs',
    hint: 'Find your key at elevenlabs.io → Profile → API Keys',
  },
  {
    section: 'Avatars',
    color: '#7c3aed',
    fields: [
      { key: 'liveavatar_api_key', label: 'API Key', placeholder: 'your_liveavatar_key', secret: true },
    ],
    docsUrl: 'https://docs.liveavatar.com',
    hint: 'Find your key at app.liveavatar.com → Developers',
  },
  {
    section: 'Workflows',
    color: '#f59e0b',
    fields: [
      { key: 'n8n_base_url', label: 'Workflow Base URL', placeholder: 'https://your-workflow-host.com', secret: false },
      { key: 'n8n_api_key', label: 'API Key', placeholder: 'n8n_api_…', secret: true },
    ],
    hint: 'Settings → API in your workflow instance. Leave blank to use only webhook triggers.',
  },
];

const SF_FIELDS = [
  { key: 'sf_instance_url', label: 'Instance URL', placeholder: 'https://yourorg.my.salesforce.com', secret: false },
  { key: 'sf_access_token', label: 'Access Token', placeholder: 'Bearer token', secret: true },
  { key: 'sf_api_version', label: 'API Version', placeholder: 'v59.0', secret: false },
  { key: 'sf_login_url', label: 'Login URL (for SSO / Connect)', placeholder: 'https://login.salesforce.com', secret: false },
  { key: 'sf_client_id', label: 'Connected App Consumer Key (for SSO / Connect)', placeholder: '3MVG9...', secret: false },
  { key: 'sf_client_secret', label: 'Connected App Consumer Secret (for Connect)', placeholder: '••••••••', secret: true },
  { key: 'sf_username', label: 'Username (for Connect)', placeholder: 'you@org.com', secret: false },
  { key: 'sf_password', label: 'Password + Security Token (for Connect)', placeholder: 'password+token', secret: true },
];

const ALL_FIELDS = [...API_KEY_SECTIONS.flatMap(s => s.fields), ...SF_FIELDS];

function SecretInput({ field, value, onChange }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder}
        style={{ paddingRight: '40px' }}
      />
      <button
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}

function FieldInput({ field, value, onChange }) {
  return field.secret ? (
    <SecretInput field={field} value={value} onChange={onChange} />
  ) : (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} />
  );
}

export default function Settings_() {
  const { showToast } = useApp();
  const [vals, setVals] = useState({});
  const [saved, setSaved] = useState(false);
  const [sfConnected, setSfConnected] = useState(salesforce.isConnected());

  useEffect(() => {
    const loaded = {};
    ALL_FIELDS.forEach(f => { loaded[f.key] = localStorage.getItem(f.key) || ''; });
    setVals(loaded);
  }, []);

  function set(key, val) {
    setVals(v => ({ ...v, [key]: val }));
    setSaved(false);
  }

  function saveAll() {
    Object.entries(vals).forEach(([k, v]) => {
      if (v) localStorage.setItem(k, v);
      else localStorage.removeItem(k);
    });
    setSfConnected(salesforce.isConnected());
    setSaved(true);
    showToast('Settings saved', 'success');
  }

  return (
    <div className="fade-in p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure API keys and service connections</p>
      </div>

      {/* Security notice */}
      <div className="glass rounded-xl p-4 flex gap-3" style={{ borderColor: 'rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.05)' }}>
        <div className="w-5 h-5 flex-shrink-0 mt-0.5">⚠️</div>
        <div>
          <p className="text-xs font-semibold text-amber-400">Security Notice</p>
          <p className="text-xs text-slate-400 mt-0.5">
            API keys are stored in your browser's localStorage and never sent to any server other than the respective service APIs. Use in a trusted environment only.
          </p>
        </div>
      </div>

      <ExpandableSection
        title="API Keys"
        subtitle="Agents, Avatars & Workflows"
        icon={Key}
        color="#00c6ff"
        defaultOpen
      >
        {API_KEY_SECTIONS.map(({ section, color, fields, hint, docsUrl }) => (
          <div key={section} className="glass-card rounded-xl overflow-hidden">
            <div
              className="px-5 py-3 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(0,198,255,0.08)', background: `${color}0a` }}
            >
              <h3 className="text-sm font-bold" style={{ color }}>{section}</h3>
              {docsUrl && (
                <a href={docsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 flex items-center gap-1 hover:text-slate-300">
                  Docs <ExternalLink size={11} />
                </a>
              )}
            </div>
            <div className="p-5 space-y-4">
              {fields.map(f => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-slate-400 block mb-1">{f.label}</label>
                  <FieldInput field={f} value={vals[f.key] || ''} onChange={v => set(f.key, v)} />
                </div>
              ))}
              {hint && <p className="text-xs text-slate-600">{hint}</p>}
            </div>
          </div>
        ))}
      </ExpandableSection>

      <ExpandableSection
        title="Salesforce Connector"
        subtitle="Sync conversations and manage contacts & prospects in Salesforce"
        icon={Cloud}
        color="#10b981"
        defaultOpen
        badge={
          <span className={`badge ${sfConnected ? 'badge-green' : 'badge-red'}`}>
            {sfConnected ? <Wifi size={10} /> : <WifiOff size={10} />}
            {sfConnected ? 'Connected' : 'Not connected'}
          </span>
        }
      >
        <div className="glass-card rounded-xl overflow-hidden">
          <div
            className="px-5 py-3 flex items-center justify-between"
            style={{ borderBottom: '1px solid rgba(0,198,255,0.08)', background: '#10b9810a' }}
          >
            <h3 className="text-sm font-bold" style={{ color: '#10b981' }}>Connection Settings</h3>
            <a href="https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 flex items-center gap-1 hover:text-slate-300">
              Docs <ExternalLink size={11} />
            </a>
          </div>
          <div className="p-5 space-y-4">
            {SF_FIELDS.map(f => (
              <div key={f.key}>
                <label className="text-xs font-medium text-slate-400 block mb-1">{f.label}</label>
                <FieldInput field={f} value={vals[f.key] || ''} onChange={v => set(f.key, v)} />
              </div>
            ))}
            <p className="text-xs text-slate-600">
              Paste an Instance URL + Access Token directly, sign in with Salesforce SSO below, or fill in the
              Connect fields and use "Connect" below to fetch them via the password OAuth flow. The org's Connected App must allow this flow and CORS for this site.
            </p>
          </div>
        </div>

        <SalesforceConnector />
      </ExpandableSection>

      <button onClick={saveAll} className="btn-primary w-full justify-center" style={{ padding: '14px' }}>
        {saved ? <CheckCircle size={16} /> : <Save size={16} />}
        {saved ? 'Saved!' : 'Save All Settings'}
      </button>

      <div className="glass-card rounded-xl p-4">
        <p className="text-xs font-semibold text-slate-400 mb-2">About Ellux</p>
        <p className="text-xs text-slate-600">
          Ellux v1.0 — Unified control panel for Agents, Avatars, and Workflows.
          All API calls are made directly from your browser to the respective services.
        </p>
      </div>
    </div>
  );
}
