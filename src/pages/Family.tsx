import { useMemo, useState } from 'react'
import { Card, PageHeader, Button, Input, EmptyState } from '../components/ui'
import { IconPlus, IconTrash, IconFamily } from '../components/icons'
import { useStore, uid } from '../lib/store'

type Member = { id: string; name: string; relation: string; birthday: string }
type Appt = { id: string; who: string; what: string; date: string }
type Med = { id: string; who: string; name: string; dose: string; schedule: string }

function daysUntilBirthday(bday: string): number | null {
  if (!bday) return null
  const [, mm, dd] = bday.split('-').map(Number)
  if (!mm || !dd) return null
  const now = new Date()
  let next = new Date(now.getFullYear(), mm - 1, dd)
  if (next < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    next = new Date(now.getFullYear() + 1, mm - 1, dd)
  }
  return Math.round((next.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86400000)
}

export default function Family() {
  const [members, setMembers] = useStore<Member[]>('family.members', [])
  const [appts, setAppts] = useStore<Appt[]>('family.appts', [])
  const [meds, setMeds] = useStore<Med[]>('family.meds', [])

  const [m, setM] = useState({ name: '', relation: '', birthday: '' })
  const [a, setA] = useState({ who: '', what: '', date: '' })
  const [med, setMed] = useState({ who: '', name: '', dose: '', schedule: '' })

  const upcoming = useMemo(() => {
    return members
      .map((mem) => ({ mem, days: daysUntilBirthday(mem.birthday) }))
      .filter((x) => x.days !== null)
      .sort((x, y) => (x.days! - y.days!))
      .slice(0, 5)
  }, [members])

  return (
    <div>
      <PageHeader title="Family" subtitle="Everyone in one place — birthdays, appointments, medicine and notes." />

      {upcoming.length > 0 && (
        <Card className="p-4 mb-6">
          <h2 className="font-bold mb-2" style={{ color: 'var(--color-text)' }}>🎂 Upcoming birthdays</h2>
          <div className="flex flex-wrap gap-2">
            {upcoming.map(({ mem, days }) => (
              <span key={mem.id} className="text-sm px-3 py-1.5 rounded-full" style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                <b>{mem.name}</b> · {days === 0 ? 'today!' : `in ${days} day${days === 1 ? '' : 's'}`}
              </span>
            ))}
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Members */}
        <Card className="p-5">
          <h2 className="font-bold text-lg mb-3" style={{ color: 'var(--color-text)' }}>Family members</h2>
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 mb-3">
            <Input value={m.name} onChange={(e) => setM({ ...m, name: e.target.value })} placeholder="Name" />
            <Input value={m.relation} onChange={(e) => setM({ ...m, relation: e.target.value })} placeholder="Relation" />
            <Input type="date" value={m.birthday} onChange={(e) => setM({ ...m, birthday: e.target.value })} className="col-span-2" />
            <Button
              className="col-span-1 row-start-2"
              onClick={() => {
                if (!m.name.trim()) return
                setMembers((p) => [...p, { id: uid('m'), ...m, name: m.name.trim() }])
                setM({ name: '', relation: '', birthday: '' })
              }}
            >
              <IconPlus width={16} height={16} />
            </Button>
          </div>
          {members.length === 0 ? (
            <EmptyState icon={<IconFamily width={36} height={36} />} title="No one added yet" />
          ) : (
            <ul className="flex flex-col gap-1">
              {members.map((mem) => (
                <li key={mem.id} className="group flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-black/5">
                  <div className="h-9 w-9 rounded-full grid place-items-center font-bold shrink-0" style={{ background: 'var(--color-accent)', color: '#06352f' }}>
                    {mem.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold" style={{ color: 'var(--color-text)' }}>{mem.name}</div>
                    <div className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      {mem.relation}{mem.birthday && ` · 🎂 ${mem.birthday}`}
                    </div>
                  </div>
                  <button onClick={() => setMembers((p) => p.filter((x) => x.id !== mem.id))} className="opacity-0 group-hover:opacity-60" style={{ color: 'var(--color-muted)' }}>
                    <IconTrash width={16} height={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Appointments */}
        <Card className="p-5">
          <h2 className="font-bold text-lg mb-3" style={{ color: 'var(--color-text)' }}>Appointments</h2>
          <div className="flex flex-col gap-2 mb-3">
            <div className="flex gap-2">
              <Input value={a.who} onChange={(e) => setA({ ...a, who: e.target.value })} placeholder="Who" />
              <Input type="date" value={a.date} onChange={(e) => setA({ ...a, date: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Input value={a.what} onChange={(e) => setA({ ...a, what: e.target.value })} placeholder="What (e.g. Dentist)" />
              <Button
                onClick={() => {
                  if (!a.what.trim()) return
                  setAppts((p) => [...p, { id: uid('a'), ...a, what: a.what.trim() }].sort((x, y) => x.date.localeCompare(y.date)))
                  setA({ who: '', what: '', date: '' })
                }}
              >
                <IconPlus width={16} height={16} />
              </Button>
            </div>
          </div>
          <ul className="flex flex-col gap-1">
            {appts.length === 0 && <li className="text-sm py-4 text-center" style={{ color: 'var(--color-muted)' }}>No appointments.</li>}
            {appts.map((ap) => (
              <li key={ap.id} className="group flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-black/5">
                <span className="text-xs font-semibold w-20 shrink-0" style={{ color: 'var(--color-accent)' }}>{ap.date || '—'}</span>
                <span className="flex-1 text-sm" style={{ color: 'var(--color-text)' }}><b>{ap.who}</b> — {ap.what}</span>
                <button onClick={() => setAppts((p) => p.filter((x) => x.id !== ap.id))} className="opacity-0 group-hover:opacity-60" style={{ color: 'var(--color-muted)' }}>
                  <IconTrash width={14} height={14} />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Medicine */}
      <Card className="p-5 mt-6">
        <h2 className="font-bold text-lg mb-3" style={{ color: 'var(--color-text)' }}>Medicine</h2>
        <div className="grid sm:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 mb-3">
          <Input value={med.who} onChange={(e) => setMed({ ...med, who: e.target.value })} placeholder="Who" />
          <Input value={med.name} onChange={(e) => setMed({ ...med, name: e.target.value })} placeholder="Medicine" />
          <Input value={med.dose} onChange={(e) => setMed({ ...med, dose: e.target.value })} placeholder="Dose" />
          <Input value={med.schedule} onChange={(e) => setMed({ ...med, schedule: e.target.value })} placeholder="Schedule" />
          <Button
            onClick={() => {
              if (!med.name.trim()) return
              setMeds((p) => [...p, { id: uid('md'), ...med, name: med.name.trim() }])
              setMed({ who: '', name: '', dose: '', schedule: '' })
            }}
          >
            <IconPlus width={16} height={16} />
          </Button>
        </div>
        {meds.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--color-muted)' }}>No medicine tracked.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {meds.map((md) => (
              <li key={md.id} className="group flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-black/5 text-sm">
                <span className="font-semibold w-24 shrink-0" style={{ color: 'var(--color-text)' }}>{md.who}</span>
                <span className="flex-1" style={{ color: 'var(--color-text)' }}>{md.name}</span>
                <span style={{ color: 'var(--color-muted)' }}>{md.dose}</span>
                <span style={{ color: 'var(--color-muted)' }}>{md.schedule}</span>
                <button onClick={() => setMeds((p) => p.filter((x) => x.id !== md.id))} className="opacity-0 group-hover:opacity-60" style={{ color: 'var(--color-muted)' }}>
                  <IconTrash width={14} height={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
