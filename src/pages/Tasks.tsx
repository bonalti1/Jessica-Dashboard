import { useState } from 'react'
import { Card, PageHeader, Button, Input, EmptyState } from '../components/ui'
import { IconPlus, IconTrash, IconCheck, IconTasks } from '../components/icons'
import { useStore, uid } from '../lib/store'

type Task = { id: string; text: string; done: boolean; created: number }

/**
 * The "Alastair Method": a master checklist alongside a brain-dump list.
 * Capture anything in the brain dump, then promote the keepers into real,
 * checkable tasks on the master list.
 */
export default function Tasks() {
  const [tasks, setTasks] = useStore<Task[]>('tasks.master', [])
  const [dump, setDump] = useStore<Task[]>('tasks.dump', [])
  const [draft, setDraft] = useState('')
  const [dumpDraft, setDumpDraft] = useState('')

  const addTask = (text: string) => {
    const t = text.trim()
    if (!t) return
    setTasks((prev) => [{ id: uid('t'), text: t, done: false, created: Date.now() }, ...prev])
    setDraft('')
  }

  const addDump = () => {
    const t = dumpDraft.trim()
    if (!t) return
    setDump((prev) => [{ id: uid('d'), text: t, done: false, created: Date.now() }, ...prev])
    setDumpDraft('')
  }

  const toggle = (id: string) =>
    setTasks((prev) => prev.map((x) => (x.id === id ? { ...x, done: !x.done } : x)))
  const removeTask = (id: string) => setTasks((prev) => prev.filter((x) => x.id !== id))
  const removeDump = (id: string) => setDump((prev) => prev.filter((x) => x.id !== id))

  const promote = (item: Task) => {
    addTask(item.text)
    removeDump(item.id)
  }

  const remaining = tasks.filter((t) => !t.done).length

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle="The Alastair Method — a master checklist plus a brain dump for everything else."
      />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Master checklist */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>Master checklist</h2>
            <span className="text-sm" style={{ color: 'var(--color-muted)' }}>{remaining} left</span>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); addTask(draft) }}
            className="flex gap-2 mb-4"
          >
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a task…" />
            <Button type="submit"><IconPlus width={18} height={18} /></Button>
          </form>

          {tasks.length === 0 ? (
            <EmptyState icon={<IconTasks width={40} height={40} />} title="No tasks yet" hint="Add one above, or promote something from your brain dump." />
          ) : (
            <ul className="flex flex-col gap-1">
              {tasks.map((t) => (
                <li key={t.id} className="group flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-black/5">
                  <button
                    onClick={() => toggle(t.id)}
                    className="h-5 w-5 rounded-md grid place-items-center shrink-0 transition"
                    style={{
                      border: '2px solid var(--color-accent)',
                      background: t.done ? 'var(--color-accent)' : 'transparent',
                    }}
                    aria-label="toggle"
                  >
                    {t.done && <IconCheck width={13} height={13} style={{ color: '#06352f' }} />}
                  </button>
                  <span
                    className="flex-1 text-sm"
                    style={{ color: 'var(--color-text)', textDecoration: t.done ? 'line-through' : 'none', opacity: t.done ? 0.5 : 1 }}
                  >
                    {t.text}
                  </span>
                  <button onClick={() => removeTask(t.id)} className="opacity-0 group-hover:opacity-60 hover:!opacity-100" style={{ color: 'var(--color-muted)' }}>
                    <IconTrash width={16} height={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Brain dump */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>Brain dump</h2>
            <span className="text-sm" style={{ color: 'var(--color-muted)' }}>{dump.length} ideas</span>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); addDump() }} className="flex gap-2 mb-4">
            <Input value={dumpDraft} onChange={(e) => setDumpDraft(e.target.value)} placeholder="Dump a thought…" />
            <Button type="submit"><IconPlus width={18} height={18} /></Button>
          </form>

          {dump.length === 0 ? (
            <EmptyState title="Clear mind ✨" hint="Jot down anything on your mind. Turn the good ones into tasks." />
          ) : (
            <ul className="flex flex-col gap-1">
              {dump.map((d) => (
                <li key={d.id} className="group flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-black/5">
                  <span className="flex-1 text-sm" style={{ color: 'var(--color-text)' }}>{d.text}</span>
                  <button
                    onClick={() => promote(d)}
                    className="text-xs font-semibold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100"
                    style={{ background: 'var(--color-accent)', color: '#06352f' }}
                  >
                    → Task
                  </button>
                  <button onClick={() => removeDump(d.id)} className="opacity-0 group-hover:opacity-60" style={{ color: 'var(--color-muted)' }}>
                    <IconTrash width={16} height={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
