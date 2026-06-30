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
    const t = setInterval(() => setNow(new Date()), 1000 * 15)
    return () => clearInterval(t)
  }, [])
  return now
}

function Section({ items, label }: { items: typeof MENU; label: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-2 px-3 opacity-45">{label}</div>
      <nav className="flex flex-col gap-0.5">
        {items.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] transition-all duration-200"
            style={({ isActive }) => ({
              color: isActive ? 'var(--color-accent)' : 'var(--color-sidebar-text)',
              fontWeight: isActive ? 600 : 450,
              background: isActive ? 'color-mix(in srgb, var(--color-accent) 14%, transparent)' : 'transparent',
            })}
          >
            {({ isActive }) => (
              <>
                <span
                  className="transition-transform duration-200 group-hover:scale-110"
                  style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-sidebar-text)', opacity: isActive ? 1 : 0.75 }}
                >
                  <Icon width={20} height={20} />
                </span>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export default function Sidebar() {
  const now = useClock()
  const hour = now.getHours() % 12 || 12
  const minute = String(now.getMinutes()).padStart(2, '0')
  const ampm = now.getHours() < 12 ? 'AM' : 'PM'
  const weekday = now.toLocaleDateString([], { weekday: 'long' })
  const monthDay = now.toLocaleDateString([], { month: 'long', day: 'numeric' })

  return (
    <aside
      className="w-[270px] shrink-0 h-full overflow-y-auto px-5 py-7 flex flex-col"
      style={{
        background: 'linear-gradient(180deg, var(--color-sidebar) 0%, var(--color-sidebar-2) 100%)',
        color: 'var(--color-sidebar-text)',
        borderRight: '1px solid color-mix(in srgb, var(--color-sidebar-text) 8%, transparent)',
      }}
    >
      {/* Elegant clock */}
      <div className="px-1">
        <div className="flex items-baseline gap-1.5 tnum">
          <span className="text-4xl font-light tracking-tight">{hour}:{minute}</span>
          <span className="text-sm font-medium opacity-60">{ampm}</span>
        </div>
        <div className="text-[12px] mt-1 opacity-55 tracking-wide">{weekday}, {monthDay}</div>
      </div>

      {/* Signature */}
      <div className="font-signature leading-[0.9] mt-7 mb-9 select-none px-1" style={{ fontSize: '52px' }}>
        Jessica<br />
        <span style={{ marginLeft: '0.4em' }}>Peña</span>
      </div>

      <div className="flex flex-col gap-6">
        <Section items={MENU} label="Menu" />
        <Section items={PREFS} label="Preferences" />
      </div>

      <div className="mt-auto pt-8 text-[11px] opacity-35 px-3">Made with love</div>
    </aside>
  )
}
