// Helpers shared by the Netlify functions.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

export const MODELS = ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5'];
export const DEFAULT_MODEL = 'claude-opus-5-5';

export const json = (body, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

/** Returns a PostgREST caller bound to the signed-in user's token, or a 401/500 Response. */
export function userDb(request) {
  const url = process.env.SUPABASE_URL, anon = process.env.SUPABASE_ANON_KEY;
  if (!url || !anon) return { error: json({ error: 'Server is not configured.' }, 500) };
  const auth = request.headers.get('authorization') || '';
  if (!/^Bearer\s+\S+$/i.test(auth)) return { error: json({ error: 'Sign in first.' }, 401) };
  const db = (path, init = {}) => fetch(url + '/rest/v1/' + path, {
    ...init,
    headers: { apikey: anon, Authorization: auth, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  return { db };
}

export const sameOrigin = request => request.headers.get('origin') === new URL(request.url).origin;

function secretKey() {
  const s = process.env.AI_KEY_SECRET;
  if (!s || s.length < 16) throw new Error('AI_KEY_SECRET is not set.');
  return createHash('sha256').update(s).digest();
}
export function encrypt(text) {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', secretKey(), iv);
  const data = Buffer.concat([c.update(text, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), data].map(b => b.toString('base64')).join('.');
}
export function decrypt(payload) {
  const [iv, tag, data] = payload.split('.').map(p => Buffer.from(p, 'base64'));
  const d = createDecipheriv('aes-256-gcm', secretKey(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(data), d.final()]).toString('utf8');
}

export async function loadSettings(db) {
  const res = await db('ai_settings?select=model,key_ciphertext,key_last4,style_notes,examples');
  if (res.status === 401 || res.status === 403) return { status: 401 };
  if (!res.ok) return { status: 502 };
  const [row] = await res.json();
  return { status: 200, row: row || null };
}
