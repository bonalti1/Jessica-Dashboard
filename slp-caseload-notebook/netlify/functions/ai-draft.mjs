// POST /api/ai-draft — drafts an assessment comment or re-evaluation with Claude,
// following the user's Learning Center style notes and saved samples.
import Anthropic from '@anthropic-ai/sdk';
import { DEFAULT_MODEL, decrypt, json, loadSettings, sameOrigin, userDb } from '../lib/shared.mjs';

const TASKS = {
  assessment: `You help a licensed speech-language pathologist (SLP) write the assessment comment for one therapy session.
Turn the clinician's brief session fragments into one concise clinical narrative paragraph, in the third person and past tense.
- Integrate the activities and materials with the patient's response.
- Keep meaningful supports and cues (for example modeling, visual cues, or the cueing level).
- Do not state numeric accuracy, percentages, or trial counts.
- Use only facts present in the notes. Do not invent behaviors, materials, or outcomes.
Reply with the comment text only: no heading, no preamble.`,
  reevaluation: `You help a licensed speech-language pathologist (SLP) draft a re-evaluation progress summary from structured record data.
Write a clear, professional draft the clinician will edit. Keep the record's section order (Background, Medical updates, Goal progress, Session assessments) and summarize each section in prose. For goal progress, describe the trend across the period, and you may cite accuracy data.
- Use only facts present in the record. Do not invent results, diagnoses, or recommendations.
- If a section has no data, say so briefly.
Reply with the draft text only, in plain text with section headings in capitals.`,
};

export default async (request) => {
  const { db, error } = userDb(request);
  if (error) return error;
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  if (!sameOrigin(request)) return json({ error: 'Invalid origin.' }, 403);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON.' }, 400); }
  const { kind, input } = body ?? {};
  if (!TASKS[kind] || typeof input !== 'string' || !input.trim() || input.length > 40000) {
    return json({ error: 'Invalid request.' }, 400);
  }

  const s = await loadSettings(db);
  if (s.status !== 200) return json({ error: s.status === 401 ? 'Sign in first.' : 'Could not load AI settings.' }, s.status);
  const row = s.row;
  let apiKey = process.env.ANTHROPIC_API_KEY || '';
  if (row?.key_ciphertext) {
    try { apiKey = decrypt(row.key_ciphertext); } catch { return json({ error: 'Saved key could not be read. Re-enter it in Settings.' }, 500); }
  }
  if (!apiKey) return json({ error: 'Add your Claude API key in Settings first.' }, 400);
  const model = row?.model || DEFAULT_MODEL;

  // Learning Center: style notes + samples of this kind become part of the system prompt.
  const samples = (row?.examples || []).filter(e => e.kind === kind).slice(-12);
  let system = TASKS[kind];
  if (row?.style_notes?.trim()) {
    system += `\n\nThe clinician's style preferences (follow these):\n<style_notes>\n${row.style_notes.trim()}\n</style_notes>`;
  }
  if (samples.length) {
    system += `\n\nSamples the clinician wrote. Match their tone, length, structure, and wording habits. Do not copy facts from them:\n` +
      samples.map((e, i) => `<sample index="${i + 1}"${e.title ? ` title="${e.title.replace(/"/g, "'")}"` : ''}>\n${e.text}\n</sample>`).join('\n');
  }

  const client = new Anthropic({ apiKey, maxRetries: 1, timeout: 25000 });
  const supportsFallback = model !== 'claude-haiku-5-5';
  try {
    const response = await client.beta.messages.create({
      model,
      max_tokens: 4000,
      output_config: { effort: 'low' },
      system,
      messages: [{ role: 'user', content: `<record>\n${input}\n</record>` }],
      ...(supportsFallback ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' } : {}),
    });
    if (response.stop_reason === 'refusal') return json({ error: 'The AI declined to draft this. Write it manually.' }, 422);
    const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
    if (!text) return json({ error: 'The AI returned an empty draft. Try again.' }, 502);
    return json({ text, model: response.model });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
      return json({ error: 'Your Claude API key was rejected. Update it in Settings.' }, 400);
    }
    if (err instanceof Anthropic.RateLimitError) return json({ error: 'Claude rate limit reached. Wait a moment and try again.' }, 429);
    if (err instanceof Anthropic.BadRequestError) return json({ error: 'Claude rejected the request: ' + err.message }, 400);
    if (err instanceof Anthropic.APIError) return json({ error: 'Claude API error. Try again.' }, 502);
    return json({ error: 'Could not reach Claude. Try again.' }, 502);
  }
};

export const config = { path: '/api/ai-draft' };
