import type { ButtonHTMLAttributes, CSSProperties, InputHTMLAttributes, ReactNode } from 'react'

export function Card({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div
      className={`rounded-2xl shadow-sm ${className}`}
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', ...style }}
    >
      {children}
    </div>
  )
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{title}</h1>
        {subtitle && <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'solid' | 'ghost' | 'outline' }
export function Button({ variant = 'solid', className = '', style, ...rest }: BtnProps) {
  const styles: Record<string, React.CSSProperties> = {
    solid: { background: 'var(--color-accent)', color: '#06352f' },
    ghost: { background: 'transparent', color: 'var(--color-muted)' },
    outline: { background: 'transparent', color: 'var(--color-text)', border: '1px solid var(--color-border)' },
  }
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-95 disabled:opacity-50 ${className}`}
      style={{ ...styles[variant], ...style }}
      {...rest}
    />
  )
}

export function Input({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`rounded-xl px-3 py-2 text-sm outline-none w-full ${className}`}
      style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
      {...rest}
    />
  )
}

export function EmptyState({ icon, title, hint }: { icon?: ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16" style={{ color: 'var(--color-muted)' }}>
      {icon && <div className="mb-3 opacity-50">{icon}</div>}
      <p className="font-medium">{title}</p>
      {hint && <p className="text-sm mt-1 max-w-sm">{hint}</p>}
    </div>
  )
}

/** "Coming soon / needs connection" banner used by Tier-2 integration pages. */
export function IntegrationNote({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="p-5">
      <div className="flex gap-3">
        <div
          className="shrink-0 h-9 w-9 rounded-full grid place-items-center text-sm font-bold"
          style={{ background: 'var(--color-accent)', color: '#06352f' }}
        >
          i
        </div>
        <div>
          <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{title}</p>
          <div className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--color-muted)' }}>{children}</div>
        </div>
      </div>
    </Card>
  )
}
