// API client helpers — all calls go through here so keys stay in one place.
// Keys are read from localStorage so the user can configure them in Settings.

const getKey = (name) => localStorage.getItem(name) || '';

// ── ElevenLabs ─────────────────────────────────────────────────────────────
const XI = () => getKey('xi_api_key');
const XI_BASE = 'https://api.elevenlabs.io/v1';

async function xiGet(path) {
  const r = await fetch(`${XI_BASE}${path}`, {
    headers: { 'xi-api-key': XI(), 'Content-Type': 'application/json' },
  });
  if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${await r.text()}`);
  return r.json();
}

async function xiPost(path, body) {
  const r = await fetch(`${XI_BASE}${path}`, {
    method: 'POST',
    headers: { 'xi-api-key': XI(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${await r.text()}`);
  return r.json();
}

async function xiPatch(path, body) {
  const r = await fetch(`${XI_BASE}${path}`, {
    method: 'PATCH',
    headers: { 'xi-api-key': XI(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${await r.text()}`);
  return r.json();
}

export const elevenLabs = {
  getVoices: () => xiGet('/voices'),
  getVoice: (id) => xiGet(`/voices/${id}`),
  editVoiceSettings: (id, settings) => xiPost(`/voices/${id}/settings/edit`, settings),
  getAgents: () => xiGet('/convai/agents'),
  getAgent: (id) => xiGet(`/convai/agents/${id}`),
  updateAgent: (id, body) => xiPatch(`/convai/agents/${id}`, body),
  getConversations: (agentId) =>
    xiGet(`/convai/conversations${agentId ? `?agent_id=${agentId}` : ''}`),
  getConversation: (id) => xiGet(`/convai/conversations/${id}`),
  getConversationAudio: (id) => `${XI_BASE}/convai/conversations/${id}/audio`,
};

// ── HeyGen ──────────────────────────────────────────────────────────────────
const HG = () => getKey('heygen_api_key');
const HG_BASE = 'https://api.heygen.com';

async function hgGet(path) {
  const r = await fetch(`${HG_BASE}${path}`, {
    headers: { 'X-Api-Key': HG(), 'Content-Type': 'application/json' },
  });
  if (!r.ok) throw new Error(`HeyGen ${r.status}: ${await r.text()}`);
  return r.json();
}

async function hgPost(path, body) {
  const r = await fetch(`${HG_BASE}${path}`, {
    method: 'POST',
    headers: { 'X-Api-Key': HG(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`HeyGen ${r.status}: ${await r.text()}`);
  return r.json();
}

async function hgPatch(path, body) {
  const r = await fetch(`${HG_BASE}${path}`, {
    method: 'PATCH',
    headers: { 'X-Api-Key': HG(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`HeyGen ${r.status}: ${await r.text()}`);
  return r.json();
}

export const heyGen = {
  getAvatars: () => hgGet('/v2/avatars'),
  getStreamingAvatars: () => hgGet('/v2/streaming/avatar/list'),
  createStreamingSession: (body) => hgPost('/v1/streaming.new', body),
  stopStreamingSession: (sessionId) => hgPost('/v1/streaming.stop', { session_id: sessionId }),
  uploadAvatarPhoto: async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const r = await fetch(`${HG_BASE}/v1/photo_avatar/photo/upload`, {
      method: 'POST',
      headers: { 'X-Api-Key': HG() },
      body: fd,
    });
    if (!r.ok) throw new Error(`HeyGen ${r.status}: ${await r.text()}`);
    return r.json();
  },
  createPhotoAvatar: (body) => hgPost('/v1/photo_avatar/avatar_group/create', body),
  getAvatarGroups: () => hgGet('/v2/avatar_group'),
  updateStreamingAvatar: (id, body) => hgPatch(`/v2/streaming/avatar/${id}`, body),
};

// ── N8N ─────────────────────────────────────────────────────────────────────
const N8N_URL = () => getKey('n8n_base_url');
const N8N_KEY = () => getKey('n8n_api_key');

async function n8nGet(path) {
  const r = await fetch(`${N8N_URL()}${path}`, {
    headers: { 'X-N8N-API-KEY': N8N_KEY(), 'Content-Type': 'application/json' },
  });
  if (!r.ok) throw new Error(`N8N ${r.status}: ${await r.text()}`);
  return r.json();
}

async function n8nPost(path, body) {
  const r = await fetch(`${N8N_URL()}${path}`, {
    method: 'POST',
    headers: { 'X-N8N-API-KEY': N8N_KEY(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`N8N ${r.status}: ${await r.text()}`);
  return r.json();
}

export const n8n = {
  getWorkflows: () => n8nGet('/api/v1/workflows'),
  triggerWebhook: (webhookUrl, payload) =>
    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then((r) => r.json()),
  executeWorkflow: (id) => n8nPost(`/api/v1/workflows/${id}/activate`, {}),
};
