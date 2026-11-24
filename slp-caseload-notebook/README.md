# SLP Caseload Notebook — Netlify + Supabase

The notebook from the original Worker/D1 snapshot, moved to:

- **Netlify**: static page (`public/`) + two functions
  - `GET/PUT /api/notebook`: loads and saves the signed-in user's notebook (same validation, 500 KB cap, origin check and revision/409 conflict handling as the original)
  - `GET /api/config`: gives the browser the public Supabase URL and anon key
- **Supabase**: email/password sign-in, plus one `notebook` row per user (`supabase/schema.sql`), protected by Row Level Security

The function forwards the user's own access token to Supabase, so RLS enforces per-user access. No service-role key is stored on Netlify.

## Set up

1. **Supabase**: create a project, then run `supabase/schema.sql` in the SQL editor.
   Under Authentication → URL Configuration, set **Site URL** to your Netlify URL (used in confirmation and password-reset emails).
2. **Netlify**: create a site from this repo with **Base directory** `slp-caseload-notebook`, then set these environment variables:
   - `SUPABASE_URL`: `https://<project-ref>.supabase.co`
   - `SUPABASE_ANON_KEY`: the project's anon/public key
3. Deploy, open the site, then click **Create account**.

Manual deploy with the CLI, from this folder:

```bash
npx netlify-cli deploy --prod
```
