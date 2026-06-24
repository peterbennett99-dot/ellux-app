import { useState, useEffect } from 'react';
import { Workflow, RefreshCw, Play, Pause, Plus, Zap, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { n8n } from '../lib/api';
import { useApp } from '../lib/store';

const STORED_KEY = 'ellux_custom_webhooks';

function loadWebhooks() {
  try { return JSON.parse(localStorage.getItem(STORED_KEY) || '[]'); } catch { return []; }
}
function saveWebhooks(wh) { localStorage.setItem(STORED_KEY, JSON.stringify(wh)); }

function WorkflowCard({ workflow, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(workflow.active);
  const { showToast } = useApp();

  async function toggleActive() {
    const goingActive = !active;
    if (!window.confirm(
      goingActive
        ? `Activate "${workflow.name}"? This enables its live triggers (webhooks/schedules) in n8n.`
        : `Deactivate "${workflow.name}"? This disables its live triggers in n8n.`
    )) return;

    setBusy(true);
    try {
      if (goingActive) await n8n.activateWorkflow(workflow.id);
      else await n8n.deactivateWorkflow(workflow.id);
      setActive(goingActive);
      showToast(`Workflow "${workflow.name}" ${goingActive ? 'activated' : 'deactivated'}`, 'success');
      onChanged?.();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass-card rounded-xl p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: active ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.1)' }}>
        <Workflow size={16} className={active ? 'text-green-400' : 'text-slate-500'} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{workflow.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`badge ${active ? 'badge-green' : 'badge-amber'}`}>{active ? 'active' : 'inactive'}</span>
        </div>
      </div>
      <button
        onClick={toggleActive}
        disabled={busy}
        className="btn-ghost flex-shrink-0"
        title={active ? 'Deactivate workflow (disables live triggers)' : 'Activate workflow (enables live triggers)'}
      >
        {active ? <Pause size={13} /> : <Play size={13} />}
        {busy ? '…' : active ? 'Deactivate' : 'Activate'}
      </button>
    </div>
  );
}

function WebhookCard({ webhook, onDelete }) {
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState('{}');
  const [triggering, setTriggering] = useState(false);
  const [last, setLast] = useState(null);
  const { showToast } = useApp();

  async function trigger() {
    setTriggering(true);
    try {
      let body = {};
      try { body = JSON.parse(payload); } catch { showToast('Invalid JSON payload', 'error'); setTriggering(false); return; }
      await n8n.triggerWebhook(webhook.url, body);
      setLast(new Date().toLocaleTimeString());
      showToast(`Webhook "${webhook.name}" triggered!`, 'success');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setTriggering(false);
    }
  }

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,158,11,0.12)' }}>
          <Zap size={16} className="text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{webhook.name}</p>
          <p className="text-xs text-slate-500 truncate">{webhook.url}</p>
          {last && <p className="text-xs text-slate-600">Last run: {last}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setOpen(o => !o)} className="btn-ghost">
            {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          <button onClick={trigger} disabled={triggering} className="btn-primary" style={{ padding: '8px 12px' }}>
            <Play size={13} />
          </button>
          <button onClick={() => onDelete(webhook.id)} className="btn-danger" style={{ padding: '8px 12px' }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4 border-t space-y-2" style={{ borderColor: 'rgba(0,198,255,0.08)' }}>
          <p className="text-xs text-slate-400 pt-3">JSON Payload</p>
          <textarea
            rows={4}
            value={payload}
            onChange={e => setPayload(e.target.value)}
            style={{ fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }}
            placeholder='{ "key": "value" }'
          />
        </div>
      )}
    </div>
  );
}

export default function N8nWorkflows() {
  const [tab, setTab] = useState('webhooks');
  const [workflows, setWorkflows] = useState([]);
  const [webhooks, setWebhooks] = useState(loadWebhooks());
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const { showToast } = useApp();

  async function loadWorkflows() {
    setLoading(true);
    try {
      const data = await n8n.getWorkflows();
      setWorkflows(data.data || data.workflows || []);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tab === 'api') loadWorkflows();
  }, [tab]);

  function addWebhook() {
    if (!newName || !newUrl) return;
    const wh = { id: Date.now().toString(), name: newName, url: newUrl };
    const updated = [...webhooks, wh];
    setWebhooks(updated);
    saveWebhooks(updated);
    setNewName(''); setNewUrl(''); setShowAdd(false);
    showToast('Webhook added', 'success');
  }

  function deleteWebhook(id) {
    const updated = webhooks.filter(w => w.id !== id);
    setWebhooks(updated);
    saveWebhooks(updated);
  }

  const tabs = [
    { id: 'webhooks', label: 'Webhooks' },
    { id: 'api', label: 'API Workflows' },
  ];

  return (
    <div className="fade-in p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Workflows</h1>
        <p className="text-sm text-slate-500 mt-1">Trigger automations and manage workflows</p>
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

      {tab === 'webhooks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">{webhooks.length} webhook{webhooks.length !== 1 ? 's' : ''} configured</p>
            <button onClick={() => setShowAdd(o => !o)} className="btn-primary" style={{ padding: '8px 14px' }}>
              <Plus size={13} />
              Add Webhook
            </button>
          </div>

          {showAdd && (
            <div className="glass-card rounded-xl p-4 space-y-3 fade-in">
              <p className="text-sm font-semibold text-white">New Webhook Trigger</p>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Workflow name…" />
              <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://your-workflow-host.com/webhook/…" />
              <div className="flex gap-2">
                <button onClick={addWebhook} className="btn-primary flex-1 justify-center">Save</button>
                <button onClick={() => setShowAdd(false)} className="btn-ghost">Cancel</button>
              </div>
            </div>
          )}

          {webhooks.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Zap size={32} className="mx-auto mb-3 opacity-30" />
              No webhooks added yet. Click "Add Webhook" to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {webhooks.map(w => <WebhookCard key={w.id} webhook={w} onDelete={deleteWebhook} />)}
            </div>
          )}
        </div>
      )}

      {tab === 'api' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">Connected via Workflow API — toggle live activation status</p>
            <button onClick={loadWorkflows} disabled={loading} className="btn-ghost">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          <div className="glass rounded-xl p-3" style={{ borderColor: 'rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.05)' }}>
            <p className="text-xs text-slate-400">
              The workflow API doesn't support running a workflow on demand — Activate/Deactivate toggles the workflow's live triggers (webhooks/schedules). To trigger a one-off run, use the <strong>Webhooks</strong> tab instead.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-500">
              <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
              Loading workflows…
            </div>
          ) : workflows.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Workflow size={32} className="mx-auto mb-3 opacity-30" />
              No workflows found. Check your Workflow URL and API key in Settings.
            </div>
          ) : (
            <div className="space-y-3">
              {workflows.map(w => <WorkflowCard key={w.id} workflow={w} onChanged={loadWorkflows} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
