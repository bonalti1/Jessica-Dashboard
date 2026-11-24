# SLP Caseload Notebook — Netlify + Supabase

The notebook from the original Worker/D1 snapshot, moved to:

- **Netlify**: static page (`public/`) + two functions
  - `GET/PUT /api/notebook`: loads and saves the signed-in user's notebook (same validation, 500 KB cap, origin check and revision/409 conflict handling as the original)
  - `GET /api/config`: gives the browser the public Supabase URL and anon key
  - `GET/PUT /api/ai-settings`: the user's Claude API key (write-only, AES-256-GCM encrypted), model, and Learning Center
  - `POST /api/ai-draft`: drafts a session assessment comment or a re-evaluation with Claude
- **Supabase**: email/password sign-in, plus one `notebook` row per user (`supabase/schema.sql`), protected by Row Level Security

The function forwards the user's own access token to Supabase, so RLS enforces per-user access. No service-role key is stored on Netlify.

## Set up

1. **Supabase**: create a project, then run `supabase/schema.sql` in the SQL editor.
   Under Authentication → URL Configuration, set **Site URL** to your Netlify URL (used in confirmation and password-reset emails).
2. **Netlify**: create a site from this repo with **Base directory** `slp-caseload-notebook`, then set these environment variables:
   - `SUPABASE_URL`: `https://<project-ref>.supabase.co`
   - `SUPABASE_ANON_KEY`: the project's anon/public key
   - `AI_KEY_SECRET`: a long random string used to encrypt saved API keys (for example `openssl rand -base64 32`). If it changes, saved keys must be re-entered.
   - `ANTHROPIC_API_KEY` (optional): a shared key used for anyone who hasn't saved their own
3. Deploy, open the site, then click **Create account**.

Manual deploy with the CLI, from this folder:

```bash
npx netlify-cli deploy --prod
```

## AI drafting and the Learning Center

Open **Settings & AI** in the header:

- **AI connection**: paste a Claude API key from console.anthropic.com and pick a model (Opus 5.5 by default; Sonnet 5.5 and Haiku 5.5 are faster). The key is checked with Anthropic, then stored encrypted. The browser never receives it back.
- **Learning Center**: style rules plus sample responses (assessment comments or re-evaluations). Every draft includes the style rules and the latest 12 samples of the matching type, so the AI copies your tone, length, and wording.

In the notebook:

- **Saved assessments → Edit assessment comments → ✨ Draft with AI** writes a comment from the session's goal work (numeric accuracy is left out), then you review it and click Save comments.
- **Re-evaluation → Build draft → ✨ Rewrite with AI** turns the template draft into prose.
- **Save as sample** on either one adds the current text to the Learning Center.

Opus 5.5 and Sonnet 5.5 requests use Anthropic's server-side refusal fallback (`fallbacks: "default"`). Drafts run at low effort so they finish within Netlify's function time limit.

Session data, including patient background text, is sent to Anthropic's API when you draft. Before using it with real patient information, put a HIPAA Business Associate Agreement in place with Anthropic, Supabase, and Netlify.
