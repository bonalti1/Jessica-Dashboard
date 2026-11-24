// GET /api/config — public Supabase settings for the browser sign-in client.
// The anon key is designed to be public; data access is enforced by RLS.
export default async () =>
  Response.json(
    { supabaseUrl: process.env.SUPABASE_URL || null, supabaseAnonKey: process.env.SUPABASE_ANON_KEY || null },
    { headers: { 'Cache-Control': 'no-store' } },
  );

export const config = { path: '/api/config' };
