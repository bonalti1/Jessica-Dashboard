import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  IconHome, IconTasks, IconWork, IconWishlist, IconPayments, IconBank, IconCalendar,
  IconHealth, IconFamily, IconAssistant, IconBell, IconSettings,
} from './icons'
import { useStore } from '../lib/store'

const MENU = [
  { to: '/home', label: 'Home', Icon: IconHome },
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

function Section({ items, label, onNavigate }: { items: typeof MENU; label: string; onNavigate?: () => void }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-1 px-3 opacity-45">{label}</div>
      <nav className="flex flex-col gap-0.5">
        {items.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className="group flex items-center gap-3 px-3 py-[7px] rounded-xl text-[14px] transition-all duration-200"
            style={({ isActive }) => ({
              color: isActive ? 'var(--color-accent)' : 'var(--color-sidebar-text)',
              fontWeight: isActive ? 600 : 450,
              background: isActive ? 'color-mix(in srgb, var(--color-accent) 14%, transparent)' : 'transparent',
            })}
          >
            {({ isActive }) => (
              <>
                <span className="transition-transform duration-200 group-hover:scale-110"
                  style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-sidebar-text)', opacity: isActive ? 1 : 0.75 }}>
                  <Icon width={18} height={18} />
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

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const now = useClock()
  const [profile] = useStore<{ name: string }>('profile', { name: 'Jessica' })
  const hour = now.getHours() % 12 || 12
  const minute = String(now.getMinutes()).padStart(2, '0')
  const ampm = now.getHours() < 12 ? 'AM' : 'PM'
  const weekday = now.toLocaleDateString([], { weekday: 'long' })
  const monthDay = now.toLocaleDateString([], { month: 'long', day: 'numeric' })
  const [first, ...rest] = (profile.name || 'Jessica Peña').split(' ')

  return (
    <aside
      className="w-[260px] h-full overflow-y-auto px-4 py-5 flex flex-col"
      style={{
        background: 'linear-gradient(180deg, var(--color-sidebar) 0%, var(--color-sidebar-2) 100%)',
        color: 'var(--color-sidebar-text)',
        borderRight: '1px solid color-mix(in srgb, var(--color-sidebar-text) 8%, transparent)',
      }}
    >
      <div className="px-1">
        <div className="flex items-baseline gap-1.5 tnum">
          <span className="text-[28px] leading-none font-light tracking-tight">{hour}:{minute}</span>
          <span className="text-xs font-medium opacity-60">{ampm}</span>
          <span className="text-[11px] ml-auto opacity-55 tracking-wide self-center">{weekday}, {monthDay}</span>
        </div>
      </div>

      <div className="font-signature leading-[0.95] mt-3 mb-5 select-none px-1" style={{ fontSize: rest.length ? '38px' : '42px' }}>
        {first}{rest.length > 0 && <><br /><span style={{ marginLeft: '0.4em' }}>{rest.join(' ')}</span></>}
      </div>

      {/* Nav fills the remaining height: Menu at the top, Preferences anchored low. */}
      <div className="flex-1 flex flex-col justify-between min-h-0 gap-4">
        <Section items={MENU} label="Menu" onNavigate={onNavigate} />
        <Section items={PREFS} label="Preferences" onNavigate={onNavigate} />
      </div>

      <div className="pt-4 text-[11px] opacity-30 px-3 shrink-0">Made with love 💜</div>
    </aside>
  )
}
