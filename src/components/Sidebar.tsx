import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  IconTasks, IconWork, IconWishlist, IconPayments, IconBank, IconCalendar,
  IconHealth, IconFamily, IconAssistant, IconBell, IconSettings,
} from './icons'

const MENU = [
  { to: '/tasks', label: 'Tasks', Icon: IconTasks },
  { to: '/work', label: 'Work list', Icon: IconWork },
  { to: '/wishlist', label: 'Wishlist', Icon: IconWishlist },
  { to: '/payments', label: 'Payments', Icon: IconPayments },
  { to: '/bank', label: 'Bank', Icon: IconBank },
  { to: '/calendar', label: 'Calendar', Icon: IconCalendar },
  { to: '/health', label: 'Health', Icon: IconHealth },
  { to: '/family', label: 'Family', Icon: IconFamily },
  { to: '/assistant', label: 'Ask AI', Icon: IconAssistant },
]

const PREFS = [
  { to: '/notifications', label: 'Notifications', Icon: IconBell },
  { to: '/settings', label: 'Settings', Icon: IconSettings },
]

function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000 * 30)
    return () => clearInterval(t)
  }, [])
  return now
}

function Section({ items }: { items: typeof MENU }) {
  return (
    <nav className="flex flex-col gap-1">
      {items.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-lg transition"
          style={({ isActive }) => ({
            color: isActive ? 'var(--color-accent)' : 'var(--color-sidebar-text)',
            fontWeight: isActive ? 700 : 500,
            background: isActive ? 'rgba(255,255,255,0.10)' : 'transparent',
          })}
        >
          {({ isActive }) => (
            <>
              <Icon style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-sidebar-text)' }} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

export default function Sidebar() {
  const now = useClock()
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toUpperCase()
  const date = `${now.getMonth() + 1}-${now.getDate()}-${String(now.getFullYear()).slice(2)}`

  return (
    <aside
      className="w-64 shrink-0 h-full overflow-y-auto px-5 py-6 flex flex-col"
      style={{ background: 'var(--color-sidebar)', color: 'var(--color-sidebar-text)' }}
    >
      <div className="text-sm font-semibold tracking-wide opacity-90">
        {time}. {date}
      </div>
      <div className="font-signature text-5xl leading-tight mt-2 mb-8 select-none">
        Jessica<br />Pena
      </div>

      <div className="text-xl font-bold mb-2">Menu</div>
      <Section items={MENU} />

      <div className="text-xl font-bold mt-8 mb-2">Preferences</div>
      <Section items={PREFS} />

      <div className="mt-auto pt-6 text-xs opacity-50">Made with love 💜</div>
    </aside>
  )
}
