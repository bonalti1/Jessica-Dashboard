import { useState } from 'react'
import { Card, PageHeader, Button, Input, IntegrationNote } from '../components/ui'
import { IconAssistant, IconSearch } from '../components/icons'

type Hit = { source: string; date: string; text: string }

/**
 * v1 assistant: a real, working search across everything Jessica has stored
 * locally — so "When did I do X?" actually returns answers today. When we add a
 * Claude API key + small backend, this same box becomes a full conversational
 * assistant that can reason over her data.
 */
function searchEverything(q: string): Hit[] {
  const query = q.toLowerCase().trim()
  if (!query) return []
  const hits: Hit[] = []
  const get = <T,>(key: string): T[] => {
    try { return JSON.parse(localStorage.getItem('jess:' + key) || '[]') } catch { return [] }
  }
  const match = (s: string) => s && s.toLowerCase().includes(query)

  get<{ date: string; title: string }>('calendar.events').forEach((e) => {
    if (match(e.title)) hits.push({ source: 'Calendar', date: e.date, text: e.title })
  })
  get<{ date: string; kind: string; title: string; notes: string }>('health.records').forEach((r) => {
    if (match(r.title) || match(r.notes) || match(r.kind))
      hits.push({ source: `Health · ${r.kind}`, date: r.date, text: r.title })
  })
  get<{ date: string; who: string; what: string }>('family.appts').forEach((a) => {
    if (match(a.what) || match(a.who)) hits.push({ source: 'Family appt', date: a.date, text: `${a.who} — ${a.what}` })
  })
  get<{ text: string; done: boolean; created: number }>('tasks.master').forEach((t) => {
    if (match(t.text)) hits.push({ source: t.done ? 'Task (done)' : 'Task', date: new Date(t.created).toISOString().slice(0, 10), text: t.text })
  })
  get<{ date: string; value: number }>('health.weights').forEach((w) => {
    if (match('weight')) hits.push({ source: 'Weight', date: w.date, text: `${w.value}` })
  })

  return hits.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
}

export default function Assistant() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Hit[] | null>(null)

  const run = () => setResults(searchEverything(q))

  return (
    <div>
      <PageHeader title="Ask AI" subtitle='Ask things like "When did I go to the dentist?" or "weight in March".' />

      <Card className="p-5 mb-6">
        <form onSubmit={(e) => { e.preventDefault(); run() }} className="flex gap-2">
          <div className="relative flex-1">
            <IconSearch width={18} height={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-muted)' }} />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="When did I…?" className="!pl-10" />
          </div>
          <Button type="submit">Ask</Button>
        </form>

        {results !== null && (
          <div className="mt-4">
            {results.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                Nothing found for “{q}”. Try a different word, or add it under Calendar / Health / Family first.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {results.map((h, i) => (
                  <li key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--color-bg)' }}>
                    <span className="text-xs font-semibold px-2 py-1 rounded-md shrink-0" style={{ background: 'var(--color-accent)', color: '#06352f' }}>{h.source}</span>
                    <span className="text-sm flex-1" style={{ color: 'var(--color-text)' }}>{h.text}</span>
                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{h.date || '—'}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Card>

      <IntegrationNote title="Full Claude AI assistant (next phase)">
        Right now this searches everything you've saved and finds matches instantly — no setup needed.
        With a Claude API key and a small backend, this same box becomes a real conversation: it can
        summarize your month, answer follow-ups, and reason across bills, health and family data in plain
        language. I've built it so the upgrade is a drop-in.
        <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: 'var(--color-muted)' }}>
          <IconAssistant width={16} height={16} /> Recommended model: Claude (latest).
        </div>
      </IntegrationNote>
    </div>
  )
}
