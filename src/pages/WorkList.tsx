import { useState } from 'react'
import { Card, PageHeader, Input } from '../components/ui'
import { IconPlus, IconTrash, IconCheck } from '../components/icons'
import { useStore, uid } from '../lib/store'

type Item = { id: string; text: string; done: boolean }
type Board = Record<string, Item[]>

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const BACKLOG = 'Unscheduled'
const TABS = ['Home', 'Work'] as const
type Tab = (typeof TABS)[number]

const emptyBoard = (): Board => Object.fromEntries([BACKLOG, ...DAYS].map((d) => [d, []]))

/** Ensure every bucket exists (older saved boards may predate the backlog). */
const normalize = (b: Board): Board => {
  const out = emptyBoard()
  for (const k of Object.keys(out)) out[k] = b[k] ?? []
  return out
}

const DRAG_MIME = 'application/x-jess-task'

function Bucket({
  name, items, draggingOver, onAdd, onToggle, onRemove, onDropItem, onDragStart, onDragOverBucket, onDragLeaveBucket, accent, className = '',
}: {
  name: string
  items: Item[]
  draggingOver: boolean
  onAdd?: (text: string) => void
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  onDropItem: (toBucket: string) => void
  onDragStart: (fromBucket: string, id: string) => void
  onDragOverBucket: (name: string) => void
  onDragLeaveBucket: () => void
  accent?: boolean
  className?: string
}) {
  const [draft, setDraft] = useState('')
  const done = items.filter((i) => i.done).length
  return (
    <Card
      className={`p-4 flex flex-col transition-colors ${className}`}
      style={{
        outline: draggingOver ? '2px solid var(--color-accent)' : '2px solid transparent',
        outlineOffset: -2,
        background: accent ? 'color-mix(in srgb, var(--color-accent) 6%, var(--color-surface))' : 'var(--color-surface)',
      }}
    >
      <div
        className="flex items-center justify-between mb-3"
        onDragOver={(e) => { e.preventDefault(); onDragOverBucket(name) }}
        onDragLeave={onDragLeaveBucket}
        onDrop={(e) => { e.preventDefault(); onDropItem(name) }}
      >
        <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>{name}</h3>
        {items.length > 0 && <span className="text-xs tnum" style={{ color: 'var(--color-muted)' }}>{done}/{items.length}</span>}
      </div>

      <ul
        className="flex flex-col gap-1 mb-3 min-h-[2.5rem] flex-1"
        onDragOver={(e) => { e.preventDefault(); onDragOverBucket(name) }}
        onDragLeave={onDragLeaveBucket}
        onDrop={(e) => { e.preventDefault(); onDropItem(name) }}
      >
        {items.length === 0 && (
          <li className="text-xs text-center py-3 rounded-lg" style={{ color: 'var(--color-muted)', border: '1px dashed var(--color-border)' }}>
            Drop here
          </li>
        )}
        {items.map((i) => (
          <li
            key={i.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(DRAG_MIME, '1')
              e.dataTransfer.effectAllowed = 'move'
              onDragStart(name, i.id)
            }}
            className="group flex items-center gap-2 rounded-lg px-2 py-1.5 cursor-grab active:cursor-grabbing"
            style={{ background: 'var(--color-bg)' }}
          >
            <span className="select-none text-xs leading-none" style={{ color: 'var(--color-muted)' }}>⋮⋮</span>
            <button
              onClick={() => onToggle(i.id)}
              className="h-4 w-4 rounded grid place-items-center shrink-0"
              style={{ border: '2px solid var(--color-accent)', background: i.done ? 'var(--color-accent)' : 'transparent' }}
            >
              {i.done && <IconCheck width={11} height={11} style={{ color: 'var(--color-on-accent)' }} />}
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

      {onAdd && (
        <form
          onSubmit={(e) => { e.preventDefault(); if (draft.trim()) { onAdd(draft.trim()); setDraft('') } }}
          className="flex gap-1 mt-auto"
        >
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add…" className="!py-1.5 text-sm" />
          <button type="submit" className="shrink-0 rounded-lg px-2" style={{ background: 'var(--color-accent)', color: 'var(--color-on-accent)' }}>
            <IconPlus width={16} height={16} />
          </button>
        </form>
      )}
    </Card>
  )
}

export default function WorkList() {
  const [tab, setTab] = useState<Tab>('Home')
  const [homeRaw, setHome] = useStore<Board>('work.home', emptyBoard())
  const [workRaw, setWork] = useStore<Board>('work.work', emptyBoard())
  const [overBucket, setOverBucket] = useState<string | null>(null)
  const [drag, setDrag] = useState<{ from: string; id: string } | null>(null)

  const board = normalize(tab === 'Home' ? homeRaw : workRaw)
  const setBoard = tab === 'Home' ? setHome : setWork

  const add = (bucket: string, text: string) =>
    setBoard((prev) => {
      const b = normalize(prev)
      return { ...b, [bucket]: [...b[bucket], { id: uid('w'), text, done: false }] }
    })
  const toggle = (bucket: string, id: string) =>
    setBoard((prev) => {
      const b = normalize(prev)
      return { ...b, [bucket]: b[bucket].map((i) => (i.id === id ? { ...i, done: !i.done } : i)) }
    })
  const remove = (bucket: string, id: string) =>
    setBoard((prev) => {
      const b = normalize(prev)
      return { ...b, [bucket]: b[bucket].filter((i) => i.id !== id) }
    })

  const handleDrop = (toBucket: string) => {
    setOverBucket(null)
    if (!drag || drag.from === toBucket) { setDrag(null); return }
    setBoard((prev) => {
      const b = normalize(prev)
      const item = b[drag.from].find((i) => i.id === drag.id)
      if (!item) return prev
      return {
        ...b,
        [drag.from]: b[drag.from].filter((i) => i.id !== drag.id),
        [toBucket]: [...b[toBucket], item],
      }
    })
    setDrag(null)
  }

  return (
    <div onDragEnd={() => { setDrag(null); setOverBucket(null) }}>
      <PageHeader title="Work list" subtitle="Drag tasks from the list onto any day. Keep Home and Work separate." />

      <div className="inline-flex rounded-xl p-1 mb-6" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-6 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: tab === t ? 'var(--color-accent)' : 'transparent', color: tab === t ? 'var(--color-on-accent)' : 'var(--color-muted)' }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex flex-col xl:flex-row gap-5">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 flex-1">
          {DAYS.map((day) => (
            <Bucket
              key={day}
              name={day}
              items={board[day]}
              draggingOver={overBucket === day}
              onAdd={(text) => add(day, text)}
              onToggle={(id) => toggle(day, id)}
              onRemove={(id) => remove(day, id)}
              onDropItem={handleDrop}
              onDragStart={(from, id) => setDrag({ from, id })}
              onDragOverBucket={setOverBucket}
              onDragLeaveBucket={() => setOverBucket((o) => (o === day ? null : o))}
            />
          ))}
        </div>

        <div className="xl:w-72 shrink-0">
          <Bucket
            name={BACKLOG}
            items={board[BACKLOG]}
            draggingOver={overBucket === BACKLOG}
            onAdd={(text) => add(BACKLOG, text)}
            onToggle={(id) => toggle(BACKLOG, id)}
            onRemove={(id) => remove(BACKLOG, id)}
            onDropItem={handleDrop}
            onDragStart={(from, id) => setDrag({ from, id })}
            onDragOverBucket={setOverBucket}
            onDragLeaveBucket={() => setOverBucket((o) => (o === BACKLOG ? null : o))}
            accent
            className="xl:sticky xl:top-4"
          />
        </div>
      </div>
    </div>
  )
}
