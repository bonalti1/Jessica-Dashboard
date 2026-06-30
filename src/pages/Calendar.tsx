import { useMemo, useState } from 'react'
import { Card, PageHeader, Button, Input, IntegrationNote } from '../components/ui'
import { IconPlus, IconTrash } from '../components/icons'
import { useStore, uid } from '../lib/store'

type Event = { id: string; date: string; title: string } // date = YYYY-MM-DD
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

export default function Calendar() {
  const today = new Date()
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() })
  const [events, setEvents] = useStore<Event[]>('calendar.events', [])
  const [selected, setSelected] = useState(iso(today.getFullYear(), today.getMonth(), today.getDate()))
  const [draft, setDraft] = useState('')

  const grid = useMemo(() => {
    const first = new Date(view.y, view.m, 1).getDay()
    const days = new Date(view.y, view.m + 1, 0).getDate()
    const cells: (number | null)[] = Array(first).fill(null)
    for (let d = 1; d <= days; d++) cells.push(d)
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [view])

  const move = (delta: number) => {
    setView((v) => {
      const m = v.m + delta
      if (m < 0) return { y: v.y - 1, m: 11 }
      if (m > 11) return { y: v.y + 1, m: 0 }
      return { ...v, m }
    })
  }

  const dayEvents = (dateStr: string) => events.filter((e) => e.date === dateStr)
  const addEvent = () => {
    if (!draft.trim()) return
    setEvents((prev) => [...prev, { id: uid('e'), date: selected, title: draft.trim() }])
    setDraft('')
  }
  const removeEvent = (id: string) => setEvents((prev) => prev.filter((e) => e.id !== id))

  const todayStr = iso(today.getFullYear(), today.getMonth(), today.getDate())

  return (
    <div>
      <PageHeader
        title="Calendar"
        subtitle="Plan the month. Click a day to add events."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => move(-1)}>‹</Button>
            <span className="font-bold" style={{ color: 'var(--color-text)', minWidth: 150, textAlign: 'center' }}>
              {MONTH_NAMES[view.m]} {view.y}
            </span>
            <Button variant="outline" onClick={() => move(1)}>›</Button>
          </div>
        }
      />

      <div className="mb-6">
        <IntegrationNote title="Google Calendar sync (ready to connect)">
          This session already has a Google Calendar connector — once you authorize it in your Claude
          connector settings, we can pull Jessica's real events in and push new ones back automatically.
          Until then, events you add here are saved locally.
        </IntegrationNote>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-4 lg:col-span-2">
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-xs font-semibold py-1" style={{ color: 'var(--color-muted)' }}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {grid.map((d, i) => {
              if (d === null) return <div key={i} />
              const dateStr = iso(view.y, view.m, d)
              const evs = dayEvents(dateStr)
              const isToday = dateStr === todayStr
              const isSel = dateStr === selected
              return (
                <button
                  key={i}
                  onClick={() => setSelected(dateStr)}
                  className="aspect-square rounded-lg p-1.5 text-left flex flex-col transition"
                  style={{
                    background: isSel ? 'var(--color-accent)' : 'var(--color-bg)',
                    border: isToday ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                  }}
                >
                  <span className="text-sm font-semibold" style={{ color: isSel ? 'var(--color-on-accent)' : 'var(--color-text)' }}>{d}</span>
                  <div className="flex flex-wrap gap-0.5 mt-auto">
                    {evs.slice(0, 3).map((e) => (
                      <span key={e.id} className="h-1.5 w-1.5 rounded-full" style={{ background: isSel ? 'var(--color-on-accent)' : 'var(--color-accent)' }} />
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="font-bold mb-1" style={{ color: 'var(--color-text)' }}>
            {new Date(selected + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </h2>
          <form onSubmit={(e) => { e.preventDefault(); addEvent() }} className="flex gap-2 my-3">
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="New event…" />
            <Button type="submit"><IconPlus width={16} height={16} /></Button>
          </form>
          <ul className="flex flex-col gap-1">
            {dayEvents(selected).length === 0 && (
              <li className="text-sm py-4 text-center" style={{ color: 'var(--color-muted)' }}>Nothing planned.</li>
            )}
            {dayEvents(selected).map((e) => (
              <li key={e.id} className="group flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-black/5">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: 'var(--color-accent)' }} />
                <span className="flex-1 text-sm" style={{ color: 'var(--color-text)' }}>{e.title}</span>
                <button onClick={() => removeEvent(e.id)} className="opacity-0 group-hover:opacity-60" style={{ color: 'var(--color-muted)' }}>
                  <IconTrash width={14} height={14} />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
