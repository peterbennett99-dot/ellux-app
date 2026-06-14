// Shared helpers for pulling contact details out of ElevenLabs conversations,
// used by both the Salesforce and HubSpot connectors.

// Pulls likely contact details (name/email/phone) out of a conversation's
// dynamic variables and data-collection results — agents vary in what they
// capture, so we scan by key pattern rather than a fixed schema.
export function extractContactInfo(conv) {
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

export function splitName(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: '', last: '' };
  if (parts.length === 1) return { first: '', last: parts[0] };
  return { first: parts.slice(0, -1).join(' '), last: parts[parts.length - 1] };
}
