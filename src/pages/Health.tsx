import { useMemo, useState } from 'react'
import { Card, PageHeader, Button, Input, EmptyState } from '../components/ui'
import { IconPlus, IconTrash, IconHealth } from '../components/icons'
import { useStore, uid } from '../lib/store'

type Weigh = { id: string; date: string; value: number }
type Record_ = { id: string; date: string; kind: string; title: string; notes: string; file?: { name: string; data: string } }

const RECORD_KINDS = ['Doctor visit', 'Lab result', 'Prescription', 'Vaccine', 'Other']

function Sparkline({ data }: { data: Weigh[] }) {
  if (data.length < 2) return null
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date))
  const vals = sorted.map((d) => d.value)
  const min = Math.min(...vals), max = Math.max(...vals)
  const range = max - min || 1
  const w = 280, h = 70
  const pts = sorted.map((d, i) => {
    const x = (i / (sorted.length - 1)) * w
    const y = h - ((d.value - min) / range) * (h - 10) - 5
    return `${x},${y}`
  }).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20">
      <polyline points={pts} fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Health() {
  const [weights, setWeights] = useStore<Weigh[]>('health.weights', [])
  const [records, setRecords] = useStore<Record_[]>('health.records', [])

  const [wDate, setWDate] = useState(new Date().toISOString().slice(0, 10))
  const [wVal, setWVal] = useState('')

  const [rKind, setRKind] = useState(RECORD_KINDS[0])
  const [rTitle, setRTitle] = useState('')
  const [rNotes, setRNotes] = useState('')
  const [rFile, setRFile] = useState<{ name: string; data: string } | undefined>()

  const addWeight = () => {
    const v = parseFloat(wVal)
    if (isNaN(v)) return
    setWeights((prev) => [...prev, { id: uid('w'), date: wDate, value: v }])
    setWVal('')
  }

  const addRecord = () => {
    if (!rTitle.trim()) return
    setRecords((prev) => [
      { id: uid('r'), date: new Date().toISOString().slice(0, 10), kind: rKind, title: rTitle.trim(), notes: rNotes.trim(), file: rFile },
      ...prev,
    ])
    setRTitle(''); setRNotes(''); setRFile(undefined)
  }

  const latest = useMemo(() => {
    if (weights.length === 0) return null
    return [...weights].sort((a, b) => b.date.localeCompare(a.date))[0]
  }, [weights])

  return (
    <div>
      <PageHeader title="Health" subtitle="Track weight over time and keep doctor visits & lab results in one place." />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>Weight</h2>
            {latest && <span className="font-bold text-xl" style={{ color: 'var(--color-accent)' }}>{latest.value}</span>}
          </div>
          <Sparkline data={weights} />
          <form onSubmit={(e) => { e.preventDefault(); addWeight() }} className="flex gap-2 mt-3">
            <Input type="date" value={wDate} onChange={(e) => setWDate(e.target.value)} className="max-w-[160px]" />
            <Input type="number" step="0.1" value={wVal} onChange={(e) => setWVal(e.target.value)} placeholder="Weight" />
            <Button type="submit"><IconPlus width={16} height={16} /></Button>
          </form>
          <ul className="flex flex-col gap-1 mt-4 max-h-48 overflow-y-auto">
            {[...weights].sort((a, b) => b.date.localeCompare(a.date)).map((w) => (
              <li key={w.id} className="group flex items-center gap-2 text-sm py-1 px-2 rounded hover:bg-black/5">
                <span style={{ color: 'var(--color-muted)' }}>{w.date}</span>
                <span className="flex-1 font-semibold" style={{ color: 'var(--color-text)' }}>{w.value}</span>
                <button onClick={() => setWeights((p) => p.filter((x) => x.id !== w.id))} className="opacity-0 group-hover:opacity-60" style={{ color: 'var(--color-muted)' }}>
                  <IconTrash width={14} height={14} />
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="font-bold text-lg mb-3" style={{ color: 'var(--color-text)' }}>Add a record</h2>
          <div className="flex flex-col gap-2">
            <select
              value={rKind}
              onChange={(e) => setRKind(e.target.value)}
              className="rounded-xl px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
            >
              {RECORD_KINDS.map((k) => <option key={k}>{k}</option>)}
            </select>
            <Input value={rTitle} onChange={(e) => setRTitle(e.target.value)} placeholder="Title (e.g. Annual physical)" />
            <textarea
              value={rNotes} onChange={(e) => setRNotes(e.target.value)} placeholder="Notes, results, instructions…" rows={2}
              className="rounded-xl px-3 py-2 text-sm outline-none resize-none"
              style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
            />
            <label className="text-sm" style={{ color: 'var(--color-muted)' }}>
              Attach a photo/PDF (optional)
              <input
                type="file"
                className="block mt-1 text-xs"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  const reader = new FileReader()
                  reader.onload = () => setRFile({ name: f.name, data: reader.result as string })
                  reader.readAsDataURL(f)
                }}
              />
            </label>
            {rFile && <span className="text-xs" style={{ color: 'var(--color-accent)' }}>Attached: {rFile.name}</span>}
            <Button onClick={addRecord}><IconPlus width={16} height={16} /> Save record</Button>
          </div>
        </Card>
      </div>

      <Card className="p-5 mt-6">
        <h2 className="font-bold text-lg mb-3" style={{ color: 'var(--color-text)' }}>Records</h2>
        {records.length === 0 ? (
          <EmptyState icon={<IconHealth width={40} height={40} />} title="No records yet" hint="Add doctor visits, labs and prescriptions above." />
        ) : (
          <ul className="flex flex-col gap-2">
            {records.map((r) => (
              <li key={r.id} className="group flex items-start gap-3 p-3 rounded-xl" style={{ background: 'var(--color-bg)' }}>
                <span className="text-xs font-semibold px-2 py-1 rounded-md shrink-0" style={{ background: 'var(--color-accent)', color: '#06352f' }}>{r.kind}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{r.title}</span>
                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{r.date}</span>
                  </div>
                  {r.notes && <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>{r.notes}</p>}
                  {r.file && (
                    <a href={r.file.data} download={r.file.name} className="text-xs font-semibold" style={{ color: 'var(--color-accent)' }}>
                      📎 {r.file.name}
                    </a>
                  )}
                </div>
                <button onClick={() => setRecords((p) => p.filter((x) => x.id !== r.id))} className="opacity-0 group-hover:opacity-60" style={{ color: 'var(--color-muted)' }}>
                  <IconTrash width={16} height={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
