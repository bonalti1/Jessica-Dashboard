// GET/PUT /api/notebook — per-user notebook storage backed by Supabase.
// The caller's Supabase access token is forwarded to PostgREST, so Row Level
// Security scopes every read and write to the signed-in user. No service-role
// key is needed on Netlify.

const MAX_BYTES = 500_000;

export default async (request) => {
  const headers = { 'Cache-Control': 'no-store' };
  const json = (body, status = 200) => Response.json(body, { status, headers });

  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return json({ error: 'Server is not configured.' }, 500);

  const auth = request.headers.get('authorization') || '';
  if (!/^Bearer\s+\S+$/i.test(auth)) return json({ error: 'Sign in to access the notebook.' }, 401);

  const db = (path, init = {}) =>
    fetch(supabaseUrl + '/rest/v1/' + path, {
      ...init,
      headers: { apikey: anonKey, Authorization: auth, 'Content-Type': 'application/json', ...(init.headers || {}) },
    });

  if (request.method === 'GET') {
    const res = await db('notebook?select=revision,document');
    if (res.status === 401 || res.status === 403) return json({ error: 'Sign in to access the notebook.' }, 401);
    if (!res.ok) return json({ error: 'Load failed.' }, 502);
    const [row] = await res.json();
    return json({ revision: row?.revision ?? 0, patients: row ? row.document : null });
  }

  if (request.method !== 'PUT') return json({ error: 'Method not allowed.' }, 405);
  if (request.headers.get('origin') !== new URL(request.url).origin) return json({ error: 'Invalid origin.' }, 403);

  const body = await request.text();
  if (new TextEncoder().encode(body).length > MAX_BYTES) return json({ error: 'Notebook is too large.' }, 413);
  let payload;
  try { payload = JSON.parse(body); } catch { return json({ error: 'Invalid JSON.' }, 400); }
  const { revision, patients } = payload ?? {};
  if (!Number.isSafeInteger(revision) || revision < 0 || !Array.isArray(patients) || !patients.length ||
      !patients.every(p => p && typeof p.id === 'string' && typeof p.name === 'string' &&
        Array.isArray(p.goals) && Array.isArray(p.updates) && Array.isArray(p.sessions))) {
    return json({ error: 'Invalid notebook.' }, 400);
  }

  const res = await db('rpc/save_notebook', {
    method: 'POST',
    body: JSON.stringify({ p_revision: revision, p_document: patients }),
  });
  if (res.status === 401 || res.status === 403) return json({ error: 'Sign in to access the notebook.' }, 401);
  if (!res.ok) return json({ error: 'Save failed.' }, 502);
  const next = await res.json();
  if (next === -1) return json({ error: 'A newer version already exists.' }, 409);
  return json({ revision: next });
};

export const config = { path: '/api/notebook' };
