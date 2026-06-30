import { useMemo, useState } from 'react'
import { Card, PageHeader, Button, IntegrationNote } from '../components/ui'
import { IconBell } from '../components/icons'
import { taskAgenda } from '../lib/agenda'

type Reminder = { source: string; date: string; text: string; days: number }

const todayMid = () => {
  const n = new Date()
  return new Date(n.getFullYear(), n.getMonth(), n.getDate())
}
const daysFromToday = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return Infinity
  return Math.round((d.getTime() - todayMid().getTime()) / 86400000)
}

function gather(): Reminder[] {
  const get = <T,>(key: string): T[] => {
    try { return JSON.parse(localStorage.getItem('jess:' + key) || '[]') } catch { return [] }
  }
  const out: Reminder[] = []

  get<{ date: string; title: string }>('calendar.events').forEach((e) => {
    const d = daysFromToday(e.date)
    if (d >= 0 && d <= 30) out.push({ source: 'Calendar', date: e.date, text: e.title, days: d })
  })
  get<{ date: string; who: string; what: string }>('family.appts').forEach((a) => {
    const d = daysFromToday(a.date)
    if (d >= 0 && d <= 30) out.push({ source: 'Appointment', date: a.date, text: `${a.who} — ${a.what}`, days: d })
  })
  get<{ name: string; birthday: string }>('family.members').forEach((m) => {
    if (!m.birthday) return
    const [, mm, dd] = m.birthday.split('-').map(Number)
    if (!mm || !dd) return
    const now = new Date()
    let next = new Date(now.getFullYear(), mm - 1, dd)
    if (next < todayMid()) next = new Date(now.getFullYear() + 1, mm - 1, dd)
    const d = Math.round((next.getTime() - todayMid().getTime()) / 86400000)
    if (d <= 30) out.push({ source: 'Birthday', date: next.toISOString().slice(0, 10), text: `${m.name}'s birthday 🎂`, days: d })
  })

  // Upcoming dated tasks (Tasks page + weekly planner), incomplete only.
  taskAgenda().forEach((t) => {
    if (t.done) return
    const d = daysFromToday(t.date)
    if (d >= 0 && d <= 30) out.push({ source: t.source === 'Task' ? 'To-do' : `${t.source} to-do`, date: t.date, text: t.title, days: d })
  })

  return out.sort((a, b) => a.days - b.days)
}

export default function Notifications() {
  const reminders = useMemo(gather, [])
  const [perm, setPerm] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'default')

  const enable = async () => {
    if (typeof Notification === 'undefined') return
    const p = await Notification.requestPermission()
    setPerm(p)
    if (p === 'granted') new Notification("Jessica's Dashboard", { body: "You'll get reminders here 💜" })
  }

  const label = (d: number) => (d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : `In ${d} days`)

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="What's coming up in the next 30 days — tasks, events, appointments and birthdays."
        action={
          perm !== 'granted'
            ? <Button onClick={enable}><IconBell width={16} height={16} /> Enable alerts</Button>
            : <span className="text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>Alerts on ✓</span>
        }
      />

      <Card className="p-5 mb-6">
        {reminders.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: 'var(--color-muted)' }}>
            Nothing coming up. Add events, appointments or birthdays and they'll show here.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {reminders.map((r, i) => (
              <li key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--color-bg)' }}>
                <div className="h-9 w-9 rounded-full grid place-items-center shrink-0" style={{ background: 'var(--color-accent)', color: 'var(--color-on-accent)' }}>
                  <IconBell width={16} height={16} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{r.text}</div>
                  <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{r.source} · {r.date}</div>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-md" style={{ background: 'var(--color-surface)', color: r.days <= 1 ? 'var(--color-accent)' : 'var(--color-muted)' }}>
                  {label(r.days)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <IntegrationNote title="Push to her phone (next phase)">
        These reminders work in the browser today. To send them to Jessica's phone, we'll add a push
        service (web push, or a calendar/email reminder) plus a tiny scheduler that checks each morning.
        It plugs into the same reminders you see above.
      </IntegrationNote>
    </div>
  )
}
