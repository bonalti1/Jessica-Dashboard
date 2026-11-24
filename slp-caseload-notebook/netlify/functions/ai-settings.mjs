// GET/PUT /api/ai-settings — the user's AI key, model, and Learning Center
// (style notes + sample responses). The key is write-only from the browser.
import Anthropic from '@anthropic-ai/sdk';
import { DEFAULT_MODEL, MODELS, encrypt, json, loadSettings, sameOrigin, userDb } from '../lib/shared.mjs';

const KINDS = ['assessment', 'reevaluation'];
const str = (v, max) => typeof v === 'string' && v.length <= max;

function publicView(row) {
  return {
    model: row?.model || DEFAULT_MODEL,
    hasKey: Boolean(row?.key_ciphertext),
    keyLast4: row?.key_last4 || null,
    serverKey: Boolean(process.env.ANTHROPIC_API_KEY),
    styleNotes: row?.style_notes || '',
    examples: row?.examples || [],
  };
}

export default async (request) => {
  const { db, error } = userDb(request);
  if (error) return error;

  if (request.method === 'GET') {
    const r = await loadSettings(db);
    if (r.status !== 200) return json({ error: r.status === 401 ? 'Sign in first.' : 'Load failed.' }, r.status);
    return json(publicView(r.row));
  }
  if (request.method !== 'PUT') return json({ error: 'Method not allowed.' }, 405);
  if (!sameOrigin(request)) return json({ error: 'Invalid origin.' }, 403);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON.' }, 400); }
  const patch = {};

  if (body.model !== undefined) {
    if (!MODELS.includes(body.model)) return json({ error: 'Unknown model.' }, 400);
    patch.model = body.model;
  }
  if (body.styleNotes !== undefined) {
    if (!str(body.styleNotes, 4000)) return json({ error: 'Style notes are too long (4,000 characters max).' }, 400);
    patch.style_notes = body.styleNotes;
  }
  if (body.examples !== undefined) {
    const ok = Array.isArray(body.examples) && body.examples.length <= 40 && body.examples.every(e =>
      e && str(e.id, 64) && KINDS.includes(e.kind) && str(e.title ?? '', 120) && str(e.text, 8000) && e.text.trim());
    if (!ok) return json({ error: 'Invalid samples (max 40, 8,000 characters each).' }, 400);
    patch.examples = body.examples.map(({ id, kind, title, text }) => ({ id, kind, title: title || '', text }));
  }
  if (body.removeKey === true) {
    patch.key_ciphertext = null;
    patch.key_last4 = null;
  } else if (body.apiKey !== undefined) {
    const key = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
    if (!key || key.length > 300) return json({ error: 'Enter an API key.' }, 400);
    // Confirm the key works before storing it.
    try {
      await new Anthropic({ apiKey: key, maxRetries: 1, timeout: 8000 }).models.retrieve(patch.model || DEFAULT_MODEL);
    } catch (err) {
      if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
        return json({ error: 'Anthropic rejected this key. Check it and try again.' }, 400);
      }
      if (err instanceof Anthropic.NotFoundError) return json({ error: 'This key cannot use the selected model.' }, 400);
      return json({ error: 'Could not reach Anthropic to verify the key. Try again.' }, 502);
    }
    try { patch.key_ciphertext = encrypt(key); } catch { return json({ error: 'Server is missing AI_KEY_SECRET.' }, 500); }
    patch.key_last4 = key.slice(-4);
  }
  if (!Object.keys(patch).length) return json({ error: 'Nothing to save.' }, 400);
  patch.updated_at = new Date().toISOString();

  const res = await db('ai_settings?on_conflict=user_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(patch),
  });
  if (res.status === 401 || res.status === 403) return json({ error: 'Sign in first.' }, 401);
  if (!res.ok) return json({ error: 'Save failed.' }, 502);
  const [row] = await res.json();
  return json(publicView(row));
};

export const config = { path: '/api/ai-settings' };
