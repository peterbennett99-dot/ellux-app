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
  if (!r.ok) throw new Error(`Agents ${r.status}: ${await r.text()}`);
  return r.json();
}

async function xiPost(path, body) {
  const r = await fetch(`${XI_BASE}${path}`, {
    method: 'POST',
    headers: { 'xi-api-key': XI(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Agents ${r.status}: ${await r.text()}`);
  return r.json();
}

async function xiPatch(path, body) {
  const r = await fetch(`${XI_BASE}${path}`, {
    method: 'PATCH',
    headers: { 'xi-api-key': XI(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Agents ${r.status}: ${await r.text()}`);
  return r.json();
}

async function xiPostForm(path, formData) {
  const r = await fetch(`${XI_BASE}${path}`, {
    method: 'POST',
    headers: { 'xi-api-key': XI() },
    body: formData,
  });
  if (!r.ok) throw new Error(`Agents ${r.status}: ${await r.text()}`);
  return r.json();
}

async function xiDelete(path) {
  const r = await fetch(`${XI_BASE}${path}`, {
    method: 'DELETE',
    headers: { 'xi-api-key': XI(), 'Content-Type': 'application/json' },
  });
  if (!r.ok) throw new Error(`Agents ${r.status}: ${await r.text()}`);
  return r.status === 204 ? null : r.json();
}

// GET /convai/agents/{id} returns both the legacy `tools` array and the new
// `tool_ids` under conversation_config.agent.prompt. PATCHing that payload back
// as-is fails with "Cannot specify both tools and tool IDs" — strip the legacy
// field before sending an agent update.
function stripLegacyTools(conversationConfig) {
  const prompt = conversationConfig?.agent?.prompt;
  if (!prompt || !('tools' in prompt)) return conversationConfig;
  const { tools, ...rest } = prompt;
  return { ...conversationConfig, agent: { ...conversationConfig.agent, prompt: rest } };
}

export const elevenLabs = {
  getVoices: () => xiGet('/voices'),
  getVoice: (id) => xiGet(`/voices/${id}`),
  editVoiceSettings: (id, settings) => xiPost(`/voices/${id}/settings/edit`, settings),
  // Instant Voice Cloning — creates a new voice from one or more audio samples.
  addVoice: (name, files, description) => {
    const fd = new FormData();
    fd.append('name', name);
    if (description) fd.append('description', description);
    for (const file of files) fd.append('files', file);
    return xiPostForm('/voices/add', fd);
  },
  getAgents: () => xiGet('/convai/agents'),
  getAgent: (id) => xiGet(`/convai/agents/${id}`),
  createAgent: (body) => xiPost('/convai/agents/create', body),
  updateAgent: (id, body) => xiPatch(`/convai/agents/${id}`, {
    ...body,
    conversation_config: body.conversation_config && stripLegacyTools(body.conversation_config),
  }),
  getConversations: (agentId) =>
    xiGet(`/convai/conversations${agentId ? `?agent_id=${agentId}` : ''}`),
  getConversation: (id) => xiGet(`/convai/conversations/${id}`),
  // The audio endpoint requires the xi-api-key header, which a plain <audio src>
  // can't send — fetch it as a blob and return an object URL instead.
  getConversationAudioUrl: async (id) => {
    const r = await fetch(`${XI_BASE}/convai/conversations/${id}/audio`, {
      headers: { 'xi-api-key': XI() },
    });
    if (!r.ok) throw new Error(`Agents ${r.status}: ${await r.text()}`);
    const blob = await r.blob();
    return URL.createObjectURL(blob);
  },
  // ── Knowledge Base ────────────────────────────────────────────────────────
  getKnowledgeBaseList: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return xiGet(`/convai/knowledge-base${qs ? `?${qs}` : ''}`);
  },
  getKnowledgeBaseDocument: (id) => xiGet(`/convai/knowledge-base/${id}`),
  createKnowledgeBaseFromText: (text, name) => xiPost('/convai/knowledge-base/text', { text, name: name || undefined }),
  createKnowledgeBaseFromUrl: (url, name) => xiPost('/convai/knowledge-base/url', { url, name: name || undefined }),
  createKnowledgeBaseFromFile: (file, name) => {
    const fd = new FormData();
    fd.append('file', file);
    if (name) fd.append('name', name);
    return xiPostForm('/convai/knowledge-base/file', fd);
  },
  deleteKnowledgeBaseDocument: (id) => xiDelete(`/convai/knowledge-base/${id}`),
};

// ── LiveAvatar ──────────────────────────────────────────────────────────────
const LA = () => getKey('liveavatar_api_key');
const LA_BASE = 'https://api.liveavatar.com';

async function laGet(path) {
  const r = await fetch(`${LA_BASE}${path}`, {
    headers: { 'X-API-KEY': LA(), 'Content-Type': 'application/json' },
  });
  if (!r.ok) throw new Error(`Avatars ${r.status}: ${await r.text()}`);
  return r.json();
}

async function laPost(path, body) {
  const r = await fetch(`${LA_BASE}${path}`, {
    method: 'POST',
    headers: { 'X-API-KEY': LA(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Avatars ${r.status}: ${await r.text()}`);
  return r.json();
}

async function laPatch(path, body) {
  const r = await fetch(`${LA_BASE}${path}`, {
    method: 'PATCH',
    headers: { 'X-API-KEY': LA(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Avatars ${r.status}: ${await r.text()}`);
  return r.json();
}

async function laDelete(path) {
  const r = await fetch(`${LA_BASE}${path}`, {
    method: 'DELETE',
    headers: { 'X-API-KEY': LA(), 'Content-Type': 'application/json' },
  });
  if (!r.ok) throw new Error(`Avatars ${r.status}: ${await r.text()}`);
  return r.json();
}

export const liveAvatar = {
  // List avatars for the authenticated user (paginated)
  getAvatars: (page = 1, pageSize = 20) => laGet(`/v1/avatars?page=${page}&page_size=${pageSize}`),
  getPublicAvatars: (page = 1, pageSize = 20) => laGet(`/v1/avatars/public?page=${page}&page_size=${pageSize}`),
  getAvatar: (id) => laGet(`/v1/avatars/${id}`),
  updateAvatar: (id, body) => laPatch(`/v1/avatars/${id}`, body),
  deleteAvatar: (id) => laDelete(`/v1/avatars/${id}`),
  // Create a short-lived embed/session for a live avatar
  createEmbed: (body) => laPost('/v2/embeddings', body),
  // One-time: register an ElevenLabs API key as a LiveAvatar secret, returns { data: { secret_id } }
  registerSecret: (secretName, secretType, secretValue) =>
    laPost('/v1/secrets', { secret_name: secretName, secret_type: secretType, secret_value: secretValue }),
  // Mint a session token for the LiveAvatar Web SDK (LITE mode + ElevenLabs agent)
  createSessionToken: (body) => laPost('/v1/sessions/token', body),
};

// ── N8N ─────────────────────────────────────────────────────────────────────
const N8N_URL = () => getKey('n8n_base_url').replace(/\/+$/, '');
const N8N_KEY = () => getKey('n8n_api_key');

async function n8nGet(path) {
  const r = await fetch(`${N8N_URL()}${path}`, {
    headers: { 'X-N8N-API-KEY': N8N_KEY(), 'Content-Type': 'application/json' },
  });
  if (!r.ok) throw new Error(`Workflows ${r.status}: ${await r.text()}`);
  return r.json();
}

async function n8nPost(path, body) {
  const r = await fetch(`${N8N_URL()}${path}`, {
    method: 'POST',
    headers: { 'X-N8N-API-KEY': N8N_KEY(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Workflows ${r.status}: ${await r.text()}`);
  return r.json();
}

// Reads a fetch Response body that may be empty or non-JSON without throwing.
async function readBody(r) {
  const text = await r.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

export const n8n = {
  getWorkflows: () => n8nGet('/api/v1/workflows'),
  // Triggers an n8n Webhook node. Response may be empty, plain text, or JSON.
  triggerWebhook: async (webhookUrl, payload) => {
    const r = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await readBody(r);
    if (!r.ok) throw new Error(`Webhook ${r.status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
    return body;
  },
  // The public n8n API has no "run once" endpoint — these toggle the workflow's
  // live trigger state (production webhooks/schedules), which is a meaningful
  // side effect distinct from a one-off execution.
  activateWorkflow: (id) => n8nPost(`/api/v1/workflows/${id}/activate`, {}),
  deactivateWorkflow: (id) => n8nPost(`/api/v1/workflows/${id}/deactivate`, {}),
};

// ── Salesforce ──────────────────────────────────────────────────────────────
const SF_INSTANCE = () => getKey('sf_instance_url').replace(/\/+$/, '');
const SF_TOKEN = () => getKey('sf_access_token');
const SF_VERSION = () => getKey('sf_api_version') || 'v59.0';
const SF_LOGIN_URL = () => (getKey('sf_login_url') || 'https://login.salesforce.com').replace(/\/+$/, '');

async function sfFetch(path, opts = {}) {
  if (!SF_INSTANCE() || !SF_TOKEN()) throw new Error('Salesforce is not connected — add your Instance URL and Access Token in Settings.');
  const r = await fetch(`${SF_INSTANCE()}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${SF_TOKEN()}`, 'Content-Type': 'application/json', ...opts.headers },
  });
  if (!r.ok) throw new Error(`Salesforce ${r.status}: ${await r.text()}`);
  return r.status === 204 ? null : r.json();
}

// Escapes single quotes for use inside a SOQL string literal.
function soqlEscape(value) {
  return String(value).replace(/'/g, "\\'");
}

// ── PKCE helpers for the OAuth 2.0 Authorization Code (SSO) flow ────────────
function base64UrlEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomString(len = 64) {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return base64UrlEncode(arr);
}

async function sha256Base64Url(input) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return base64UrlEncode(digest);
}

const SF_PKCE_VERIFIER_KEY = 'sf_pkce_verifier';
const SF_OAUTH_STATE_KEY = 'sf_oauth_state';

export const salesforce = {
  isConnected: () => !!(SF_INSTANCE() && SF_TOKEN()),

  // Resource-Owner Password Credentials flow: exchanges Connected App
  // credentials + username/password(+security token) for an access token.
  // Requires the org's Connected App to allow this flow and CORS for this origin.
  authenticate: async ({ clientId, clientSecret, username, password }) => {
    const params = new URLSearchParams({
      grant_type: 'password',
      client_id: clientId,
      client_secret: clientSecret,
      username,
      password,
    });
    const r = await fetch(`${SF_LOGIN_URL()}/services/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    if (!r.ok) throw new Error(`Salesforce auth ${r.status}: ${await r.text()}`);
    const data = await r.json();
    localStorage.setItem('sf_access_token', data.access_token);
    localStorage.setItem('sf_instance_url', data.instance_url);
    return data;
  },

  // SSO (OAuth 2.0 Authorization Code + PKCE): builds the Salesforce login/
  // consent URL to redirect the browser to. No client secret required —
  // the Connected App must have "Require Proof Key for Code Exchange (PKCE)"
  // enabled and this app's URL listed as a Callback URL.
  getAuthorizeUrl: async ({ clientId, loginUrl, redirectUri }) => {
    const verifier = randomString();
    const state = randomString(16);
    sessionStorage.setItem(SF_PKCE_VERIFIER_KEY, verifier);
    sessionStorage.setItem(SF_OAUTH_STATE_KEY, state);
    const challenge = await sha256Base64Url(verifier);
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      scope: 'api refresh_token',
      state,
    });
    return `${(loginUrl || 'https://login.salesforce.com').replace(/\/+$/, '')}/services/oauth2/authorize?${params.toString()}`;
  },

  // Completes the SSO flow: exchanges the authorization code (from the
  // redirect back to this app) for an access token + instance URL.
  exchangeCodeForToken: async ({ code, state, clientId, loginUrl, redirectUri }) => {
    const expectedState = sessionStorage.getItem(SF_OAUTH_STATE_KEY);
    if (expectedState && state && expectedState !== state) {
      throw new Error('Salesforce SSO failed: state mismatch (possible CSRF). Please try connecting again.');
    }
    const verifier = sessionStorage.getItem(SF_PKCE_VERIFIER_KEY) || '';
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    });
    const r = await fetch(`${(loginUrl || 'https://login.salesforce.com').replace(/\/+$/, '')}/services/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    sessionStorage.removeItem(SF_PKCE_VERIFIER_KEY);
    sessionStorage.removeItem(SF_OAUTH_STATE_KEY);
    if (!r.ok) throw new Error(`Salesforce SSO ${r.status}: ${await r.text()}`);
    const data = await r.json();
    localStorage.setItem('sf_access_token', data.access_token);
    localStorage.setItem('sf_instance_url', data.instance_url);
    if (data.refresh_token) localStorage.setItem('sf_refresh_token', data.refresh_token);
    return data;
  },

  // Refreshes the access token using a previously-issued refresh token.
  refreshAccessToken: async ({ clientId, loginUrl }) => {
    const refreshToken = getKey('sf_refresh_token');
    if (!refreshToken) throw new Error('No Salesforce refresh token available — reconnect via SSO.');
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      refresh_token: refreshToken,
    });
    const r = await fetch(`${(loginUrl || 'https://login.salesforce.com').replace(/\/+$/, '')}/services/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    if (!r.ok) throw new Error(`Salesforce token refresh ${r.status}: ${await r.text()}`);
    const data = await r.json();
    localStorage.setItem('sf_access_token', data.access_token);
    if (data.instance_url) localStorage.setItem('sf_instance_url', data.instance_url);
    return data;
  },

  disconnect: () => {
    ['sf_access_token', 'sf_instance_url', 'sf_refresh_token'].forEach(k => localStorage.removeItem(k));
  },

  // Simple connectivity check — fetches org limits, which any authenticated user can read.
  testConnection: () => sfFetch(`/services/data/${SF_VERSION()}/limits`),

  query: (soql) => sfFetch(`/services/data/${SF_VERSION()}/query?q=${encodeURIComponent(soql)}`),

  createRecord: (sobject, fields) => sfFetch(`/services/data/${SF_VERSION()}/sobjects/${sobject}`, {
    method: 'POST',
    body: JSON.stringify(fields),
  }),

  updateRecord: (sobject, id, fields) => sfFetch(`/services/data/${SF_VERSION()}/sobjects/${sobject}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(fields),
  }),

  findContactByEmail: async (email) => {
    const res = await salesforce.query(`SELECT Id, FirstName, LastName, Email, Phone FROM Contact WHERE Email = '${soqlEscape(email)}' LIMIT 1`);
    return res.records?.[0] || null;
  },

  findContactByPhone: async (phone) => {
    const res = await salesforce.query(`SELECT Id, FirstName, LastName, Email, Phone FROM Contact WHERE Phone = '${soqlEscape(phone)}' LIMIT 1`);
    return res.records?.[0] || null;
  },

  findLeadByEmail: async (email) => {
    const res = await salesforce.query(`SELECT Id, FirstName, LastName, Email, Phone, Company FROM Lead WHERE Email = '${soqlEscape(email)}' AND IsConverted = false LIMIT 1`);
    return res.records?.[0] || null;
  },

  findLeadByPhone: async (phone) => {
    const res = await salesforce.query(`SELECT Id, FirstName, LastName, Email, Phone, Company FROM Lead WHERE Phone = '${soqlEscape(phone)}' AND IsConverted = false LIMIT 1`);
    return res.records?.[0] || null;
  },

  // Contacts represent known people (typically linked to an Account in Salesforce).
  createContact: (fields) => salesforce.createRecord('Contact', fields),

  // Leads represent prospects not yet qualified into Accounts/Contacts.
  createLead: (fields) => salesforce.createRecord('Lead', fields),

  createTask: (fields) => salesforce.createRecord('Task', fields),
};
