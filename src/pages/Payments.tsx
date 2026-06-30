import { useMemo, useRef, useState } from 'react'
import { Card, PageHeader, Button, Input } from '../components/ui'
import { IconPlus, IconTrash } from '../components/icons'
import { useStore, uid } from '../lib/store'

type Bill = { id: string; name: string; amount: number }
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const money = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

/**
 * One month cell.
 *   • single tap → toggle paid/unpaid (fills the bill's usual amount)
 *   • double tap → edit the amount for that month
 * A short click-timer keeps single and double taps from fighting, and
 * touch-action:manipulation disables mobile double-tap-zoom so it stays crisp.
 */
function PaidCell({ value, expected, onToggle, onSet }: {
  value: number | undefined
  expected: number
  onToggle: () => void
  onSet: (v: number | null) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const timer = useRef<number | null>(null)
  const paid = value !== undefined

  const onClick = () => {
    if (timer.current) return
    timer.current = window.setTimeout(() => { timer.current = null; onToggle() }, 230)
  }
  const onDouble = () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
    setDraft(String(value ?? expected ?? ''))
    setEditing(true)
  }
  const commit = () => {
    onSet(draft.trim() === '' ? null : parseFloat(draft))
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
        className="h-8 w-16 text-center rounded-lg outline-none mx-auto"
        style={{ background: 'var(--color-surface)', border: '2px solid var(--color-accent)', color: 'var(--color-text)', fontWeight: 600 }}
      />
    )
  }

  return (
    <button
      onClick={onClick}
      onDoubleClick={onDouble}
      title={paid ? 'Tap to undo · double-tap to edit the amount' : 'Tap to mark paid · double-tap to set a custom amount'}
      className="h-8 w-16 text-center rounded-lg mx-auto transition-colors text-sm"
      style={{
        touchAction: 'manipulation',
        background: paid ? 'color-mix(in srgb, var(--color-accent) 22%, transparent)' : 'var(--color-bg)',
        border: `1px solid ${paid ? 'color-mix(in srgb, var(--color-accent) 45%, transparent)' : 'var(--color-border)'}`,
        color: paid ? 'var(--color-text)' : 'var(--color-muted)',
        fontWeight: paid ? 600 : 400,
      }}
    >
      {paid ? money(value!) : <span style={{ opacity: 0.45 }}>{expected ? money(expected) : ''}</span>}
    </button>
  )
}

const DEFAULT_BILLS: Bill[] = [
  { id: uid('b'), name: 'Mortgage / Rent', amount: 1800 },
  { id: uid('b'), name: 'Electric', amount: 140 },
  { id: uid('b'), name: 'Water', amount: 60 },
  { id: uid('b'), name: 'Internet', amount: 80 },
  { id: uid('b'), name: 'Car payment', amount: 420 },
  { id: uid('b'), name: 'Phone', amount: 110 },
]

export default function Payments() {
  const thisYear = new Date().getFullYear()
  const [year, setYear] = useStore<number>('pay.year', thisYear)
  const [bills, setBills] = useStore<Bill[]>('pay.bills', DEFAULT_BILLS)
  // Per-cell amount actually paid: key `${year}:${billId}:${monthIndex}` -> number.
  // Presence of a value means "paid"; the value is how much (can differ each month).
  const [cells, setCells] = useStore<Record<string, number>>('pay.cells', {})
  const [income, setIncome] = useStore<Record<string, number>>('pay.income', {})

  const [newName, setNewName] = useState('')
  const [newAmount, setNewAmount] = useState('')

  const key = (billId: string, m: number) => `${year}:${billId}:${m}`

  const setCell = (billId: string, m: number, value: number | null) =>
    setCells((prev) => {
      const next = { ...prev }
      if (value === null || isNaN(value)) delete next[key(billId, m)]
      else next[key(billId, m)] = value
      return next
    })

  const addBill = () => {
    const name = newName.trim()
    const amount = parseFloat(newAmount)
    if (!name) return
    setBills((prev) => [...prev, { id: uid('b'), name, amount: isNaN(amount) ? 0 : amount }])
    setNewName(''); setNewAmount('')
  }
  const removeBill = (id: string) => setBills((prev) => prev.filter((b) => b.id !== id))
  const editBaseAmount = (id: string, amount: number) =>
    setBills((prev) => prev.map((b) => (b.id === id ? { ...b, amount } : b)))

  const expectedMonthly = useMemo(() => bills.reduce((s, b) => s + b.amount, 0), [bills])

  const rowTotal = (billId: string) =>
    MONTHS.reduce((s, _, m) => s + (cells[key(billId, m)] ?? 0), 0)

  const colTotals = useMemo(
    () => MONTHS.map((_, m) => bills.reduce((s, b) => s + (cells[key(b.id, m)] ?? 0), 0)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bills, cells, year],
  )

  const yearPaid = colTotals.reduce((s, n) => s + n, 0)
  const yearIncome = MONTHS.reduce((s, _, m) => s + (income[`${year}:${m}`] ?? 0), 0)
  const incomeTotal = yearIncome

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle="Your bills for the whole year. Tap a cell to mark it paid; double-tap to edit the amount."
        action={
          <div className="flex items-center gap-1.5">
            <Button variant="outline" onClick={() => setYear((y) => y - 1)}>‹</Button>
            <span className="font-semibold text-lg tnum px-1" style={{ color: 'var(--color-text)' }}>{year}</span>
            <Button variant="outline" onClick={() => setYear((y) => y + 1)}>›</Button>
          </div>
        }
      />

      <div className="grid sm:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>Expected / month</p>
          <p className="text-2xl font-semibold mt-1 tnum" style={{ color: 'var(--color-text)' }}>{money(expectedMonthly)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>Paid in {year}</p>
          <p className="text-2xl font-semibold mt-1 tnum" style={{ color: 'var(--color-accent)' }}>{money(yearPaid)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>Income in {year}</p>
          <p className="text-2xl font-semibold mt-1 tnum" style={{ color: 'var(--color-text)' }}>{money(incomeTotal)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>Net</p>
          <p className="text-2xl font-semibold mt-1 tnum" style={{ color: yearIncome - yearPaid >= 0 ? 'var(--color-accent)' : '#e08a8a' }}>
            {money(yearIncome - yearPaid)}
          </p>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm tnum">
            <thead>
              <tr style={{ background: 'var(--color-bg)' }}>
                <th className="sticky left-0 z-10 text-left px-4 py-3 font-semibold" style={{ background: 'var(--color-bg)', color: 'var(--color-text)', minWidth: 190 }}>Bill</th>
                {MONTHS.map((m) => (
                  <th key={m} className="px-2 py-3 font-medium text-center" style={{ color: 'var(--color-muted)', minWidth: 58 }}>{m}</th>
                ))}
                <th className="px-3 py-3 font-semibold text-right sticky right-0 z-10" style={{ background: 'var(--color-bg)', color: 'var(--color-text)', minWidth: 90 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((b) => (
                <tr key={b.id} className="group" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <td className="sticky left-0 z-10 px-4 py-2" style={{ background: 'var(--color-surface)' }}>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <input
                          value={b.name}
                          onChange={(e) => setBills((prev) => prev.map((x) => x.id === b.id ? { ...x, name: e.target.value } : x))}
                          className="font-medium bg-transparent outline-none w-full"
                          style={{ color: 'var(--color-text)' }}
                        />
                        <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                          <span>usually $</span>
                          <input
                            type="number"
                            value={b.amount || ''}
                            placeholder="0"
                            onChange={(e) => editBaseAmount(b.id, parseFloat(e.target.value) || 0)}
                            title="Default amount — fills in when you mark a month paid"
                            className="w-14 bg-transparent outline-none"
                            style={{ color: 'var(--color-muted)' }}
                          />
                        </div>
                      </div>
                      <button onClick={() => removeBill(b.id)} className="opacity-0 group-hover:opacity-60 shrink-0 self-start mt-1" style={{ color: 'var(--color-muted)' }}>
                        <IconTrash width={14} height={14} />
                      </button>
                    </div>
                  </td>
                  {MONTHS.map((_, m) => {
                    const val = cells[key(b.id, m)]
                    return (
                      <td key={m} className="px-1 py-1 text-center">
                        <PaidCell
                          value={val}
                          expected={b.amount}
                          onToggle={() => setCell(b.id, m, val === undefined ? (b.amount || 0) : null)}
                          onSet={(v) => setCell(b.id, m, v)}
                        />
                      </td>
                    )
                  })}
                  <td className="px-3 py-2 text-right font-semibold sticky right-0 z-10" style={{ background: 'var(--color-surface)', color: 'var(--color-text)' }}>
                    {money(rowTotal(b.id))}
                  </td>
                </tr>
              ))}

              {/* Income row */}
              <tr style={{ borderTop: '2px solid var(--color-border)', background: 'var(--color-bg)' }}>
                <td className="sticky left-0 z-10 px-4 py-2 font-semibold" style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>Income</td>
                {MONTHS.map((_, m) => (
                  <td key={m} className="px-1 py-1 text-center">
                    <input
                      type="number"
                      value={income[`${year}:${m}`] ?? ''}
                      placeholder="0"
                      onChange={(e) => setIncome((prev) => {
                        const next = { ...prev }
                        if (e.target.value === '') delete next[`${year}:${m}`]
                        else next[`${year}:${m}`] = parseFloat(e.target.value) || 0
                        return next
                      })}
                      className="h-8 w-14 text-center rounded-lg outline-none bg-transparent text-xs"
                      style={{ color: 'var(--color-text)' }}
                    />
                  </td>
                ))}
                <td className="px-3 py-2 text-right font-semibold sticky right-0 z-10" style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>{money(yearIncome)}</td>
              </tr>

              {/* Column totals */}
              <tr style={{ borderTop: '1px solid var(--color-border)' }}>
                <td className="sticky left-0 z-10 px-4 py-3 font-semibold" style={{ background: 'var(--color-surface)', color: 'var(--color-text)' }}>Total paid</td>
                {colTotals.map((amt, m) => (
                  <td key={m} className="px-1 py-3 text-center text-xs font-semibold" style={{ color: amt > 0 ? 'var(--color-accent)' : 'var(--color-muted)' }}>
                    {amt > 0 ? money(amt) : '—'}
                  </td>
                ))}
                <td className="px-3 py-3 text-right font-bold sticky right-0 z-10" style={{ background: 'var(--color-surface)', color: 'var(--color-accent)' }}>{money(yearPaid)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center gap-2 p-4" style={{ borderTop: '1px solid var(--color-border)' }}>
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New bill name" className="max-w-xs" />
          <Input value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="Expected amount" type="number" className="max-w-[150px]" />
          <Button onClick={addBill}><IconPlus width={16} height={16} /> Add bill</Button>
        </div>
      </Card>

      <p className="text-xs mt-3" style={{ color: 'var(--color-muted)' }}>
        Tap a month cell to mark it paid (it fills the usual amount) — tap again to undo. Double-tap a cell to edit the amount for a month it changed. Row totals (right) show what you paid per bill; the bottom row shows each month's total.
      </p>
    </div>
  )
}
