import { useState } from 'react'
import { Card, PageHeader, Input } from '../components/ui'
import { IconPlus, IconTrash, IconCheck } from '../components/icons'
import { useStore, uid } from '../lib/store'

type Item = { id: string; text: string; done: boolean }
type Board = Record<string, Item[]>

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const TABS = ['Home', 'Work'] as const
type Tab = (typeof TABS)[number]

const emptyBoard = (): Board => Object.fromEntries(DAYS.map((d) => [d, []]))

function DayColumn({
  day, items, onAdd, onToggle, onRemove,
}: {
  day: string; items: Item[]
  onAdd: (text: string) => void
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}) {
  const [draft, setDraft] = useState('')
  const done = items.filter((i) => i.done).length
  return (
    <Card className="p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold" style={{ color: 'var(--color-text)' }}>{day}</h3>
        {items.length > 0 && (
          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{done}/{items.length}</span>
        )}
      </div>
      <ul className="flex flex-col gap-1 mb-3 min-h-[1rem]">
        {items.map((i) => (
          <li key={i.id} className="group flex items-center gap-2">
            <button
              onClick={() => onToggle(i.id)}
              className="h-4 w-4 rounded grid place-items-center shrink-0"
              style={{ border: '2px solid var(--color-accent)', background: i.done ? 'var(--color-accent)' : 'transparent' }}
            >
              {i.done && <IconCheck width={11} height={11} style={{ color: '#06352f' }} />}
            </button>
            <span className="flex-1 text-sm" style={{ color: 'var(--color-text)', textDecoration: i.done ? 'line-through' : 'none', opacity: i.done ? 0.5 : 1 }}>
              {i.text}
            </span>
            <button onClick={() => onRemove(i.id)} className="opacity-0 group-hover:opacity-60" style={{ color: 'var(--color-muted)' }}>
              <IconTrash width={14} height={14} />
            </button>
          </li>
        ))}
      </ul>
      <form
        onSubmit={(e) => { e.preventDefault(); if (draft.trim()) { onAdd(draft.trim()); setDraft('') } }}
        className="flex gap-1 mt-auto"
      >
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add…" className="!py-1.5 text-sm" />
        <button type="submit" className="shrink-0 rounded-lg px-2" style={{ background: 'var(--color-accent)', color: '#06352f' }}>
          <IconPlus width={16} height={16} />
        </button>
      </form>
    </Card>
  )
}

export default function WorkList() {
  const [tab, setTab] = useState<Tab>('Home')
  const [home, setHome] = useStore<Board>('work.home', emptyBoard())
  const [work, setWork] = useStore<Board>('work.work', emptyBoard())

  const board = tab === 'Home' ? home : work
  const setBoard = tab === 'Home' ? setHome : setWork

  const add = (day: string, text: string) =>
    setBoard((prev) => ({ ...prev, [day]: [...(prev[day] ?? []), { id: uid('w'), text, done: false }] }))
  const toggle = (day: string, id: string) =>
    setBoard((prev) => ({ ...prev, [day]: prev[day].map((i) => (i.id === id ? { ...i, done: !i.done } : i)) }))
  const remove = (day: string, id: string) =>
    setBoard((prev) => ({ ...prev, [day]: prev[day].filter((i) => i.id !== id) }))

  return (
    <div>
      <PageHeader title="Work list" subtitle="Your week at a glance — keep Home and Work separate." />

      <div className="inline-flex rounded-xl p-1 mb-6" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition"
            style={{ background: tab === t ? 'var(--color-accent)' : 'transparent', color: tab === t ? '#06352f' : 'var(--color-muted)' }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {DAYS.map((day) => (
          <DayColumn
            key={day}
            day={day}
            items={board[day] ?? []}
            onAdd={(text) => add(day, text)}
            onToggle={(id) => toggle(day, id)}
            onRemove={(id) => remove(day, id)}
          />
        ))}
      </div>
    </div>
  )
}
