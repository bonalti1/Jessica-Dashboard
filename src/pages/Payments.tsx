import { useMemo, useState } from 'react'
import { Card, PageHeader, Button, Input } from '../components/ui'
import { IconPlus, IconTrash, IconCheck } from '../components/icons'
import { useStore, uid } from '../lib/store'

type Bill = { id: string; name: string; amount: number }
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const money = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

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
  // paid map: key `${year}:${billId}:${monthIndex}` -> true
  const [paid, setPaid] = useStore<Record<string, boolean>>('pay.paid', {})
  // income map: key `${year}:${monthIndex}` -> number
  const [income, setIncome] = useStore<Record<string, number>>('pay.income', {})

  const [newName, setNewName] = useState('')
  const [newAmount, setNewAmount] = useState('')

  const key = (billId: string, m: number) => `${year}:${billId}:${m}`
  const isPaid = (billId: string, m: number) => !!paid[key(billId, m)]
  const togglePaid = (billId: string, m: number) =>
    setPaid((prev) => ({ ...prev, [key(billId, m)]: !prev[key(billId, m)] }))

  const addBill = () => {
    const name = newName.trim()
    const amount = parseFloat(newAmount)
    if (!name || isNaN(amount)) return
    setBills((prev) => [...prev, { id: uid('b'), name, amount }])
    setNewName(''); setNewAmount('')
  }
  const removeBill = (id: string) => setBills((prev) => prev.filter((b) => b.id !== id))
  const editAmount = (id: string, amount: number) =>
    setBills((prev) => prev.map((b) => (b.id === id ? { ...b, amount } : b)))

  const totalDue = useMemo(() => bills.reduce((s, b) => s + b.amount, 0), [bills])

  // Per-month paid totals
  const paidByMonth = useMemo(() => {
    return MONTHS.map((_, m) => bills.reduce((s, b) => s + (isPaid(b.id, m) ? b.amount : 0), 0))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bills, paid, year])

  const yearPaid = paidByMonth.reduce((s, n) => s + n, 0)
  const yearIncome = MONTHS.reduce((s, _, m) => s + (income[`${year}:${m}`] ?? 0), 0)

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle="Your bills for the whole year. Click any cell to mark it paid."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setYear((y) => y - 1)}>‹</Button>
            <span className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>{year}</span>
            <Button variant="outline" onClick={() => setYear((y) => y + 1)}>›</Button>
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>Monthly bills</p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>{money(totalDue)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>Paid in {year}</p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-accent)' }}>{money(yearPaid)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>Income in {year}</p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>{money(yearIncome)}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>Net: {money(yearIncome - yearPaid)}</p>
        </Card>
      </div>

      {/* The grid */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr style={{ background: 'var(--color-bg)' }}>
                <th className="sticky left-0 z-10 text-left px-4 py-3 font-semibold" style={{ background: 'var(--color-bg)', color: 'var(--color-text)', minWidth: 180 }}>
                  Bill
                </th>
                <th className="px-3 py-3 font-semibold text-right" style={{ color: 'var(--color-muted)', minWidth: 90 }}>Amount</th>
                {MONTHS.map((m) => (
                  <th key={m} className="px-2 py-3 font-semibold text-center" style={{ color: 'var(--color-muted)', minWidth: 52 }}>{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bills.map((b) => (
                <tr key={b.id} className="group" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <td className="sticky left-0 z-10 px-4 py-2" style={{ background: 'var(--color-surface)' }}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium" style={{ color: 'var(--color-text)' }}>{b.name}</span>
                      <button onClick={() => removeBill(b.id)} className="opacity-0 group-hover:opacity-60" style={{ color: 'var(--color-muted)' }}>
                        <IconTrash width={14} height={14} />
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      value={b.amount}
                      onChange={(e) => editAmount(b.id, parseFloat(e.target.value) || 0)}
                      className="w-20 text-right rounded-md px-2 py-1 bg-transparent outline-none"
                      style={{ color: 'var(--color-text)', border: '1px solid transparent' }}
                      onFocus={(e) => (e.target.style.border = '1px solid var(--color-border)')}
                      onBlur={(e) => (e.target.style.border = '1px solid transparent')}
                    />
                  </td>
                  {MONTHS.map((_, m) => {
                    const on = isPaid(b.id, m)
                    return (
                      <td key={m} className="px-1 py-1 text-center">
                        <button
                          onClick={() => togglePaid(b.id, m)}
                          title={on ? 'Paid' : 'Mark paid'}
                          className="h-8 w-8 rounded-lg grid place-items-center mx-auto transition"
                          style={{
                            background: on ? 'var(--color-accent)' : 'var(--color-bg)',
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          {on && <IconCheck width={15} height={15} style={{ color: '#06352f' }} />}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}

              {/* Income row */}
              <tr style={{ borderTop: '2px solid var(--color-border)', background: 'var(--color-bg)' }}>
                <td className="sticky left-0 z-10 px-4 py-2 font-semibold" style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                  Income
                </td>
                <td />
                {MONTHS.map((_, m) => (
                  <td key={m} className="px-1 py-1">
                    <input
                      type="number"
                      value={income[`${year}:${m}`] ?? ''}
                      placeholder="0"
                      onChange={(e) =>
                        setIncome((prev) => ({ ...prev, [`${year}:${m}`]: parseFloat(e.target.value) || 0 }))
                      }
                      className="w-12 text-center rounded-md py-1 bg-transparent outline-none text-xs"
                      style={{ color: 'var(--color-text)' }}
                    />
                  </td>
                ))}
              </tr>

              {/* Paid total row */}
              <tr style={{ borderTop: '1px solid var(--color-border)' }}>
                <td className="sticky left-0 z-10 px-4 py-3 font-semibold" style={{ background: 'var(--color-surface)', color: 'var(--color-text)' }}>
                  Paid / month
                </td>
                <td />
                {paidByMonth.map((amt, m) => (
                  <td key={m} className="px-1 py-3 text-center text-xs font-semibold" style={{ color: amt > 0 ? 'var(--color-accent)' : 'var(--color-muted)' }}>
                    {amt > 0 ? money(amt) : '—'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Add bill */}
        <div className="flex items-center gap-2 p-4" style={{ borderTop: '1px solid var(--color-border)' }}>
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New bill name" className="max-w-xs" />
          <Input value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="Amount" type="number" className="max-w-[120px]" />
          <Button onClick={addBill}><IconPlus width={16} height={16} /> Add bill</Button>
        </div>
      </Card>

      <p className="text-xs mt-3" style={{ color: 'var(--color-muted)' }}>
        Tip: edit any amount inline, type income per month, and click cells to track what's paid.
        Everything saves automatically.
      </p>
    </div>
  )
}
