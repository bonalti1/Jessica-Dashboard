import { useState } from 'react'
import { Card, PageHeader, Button, Input, IntegrationNote, EmptyState } from '../components/ui'
import { IconPlus, IconTrash, IconBank } from '../components/icons'
import { useStore, uid } from '../lib/store'

type Account = { id: string; name: string; type: string; balance: number }
const money = (n: number) => n.toLocaleString(undefined, { style: 'currency', currency: 'USD' })

export default function Bank() {
  const [accounts, setAccounts] = useStore<Account[]>('bank.accounts', [])
  const [draft, setDraft] = useState({ name: '', type: 'Checking', balance: '' })

  const total = accounts.reduce((s, a) => s + a.balance, 0)

  return (
    <div>
      <PageHeader title="Bank" subtitle="Track balances now — connect your real accounts later." />

      <div className="mb-6">
        <IntegrationNote title="Connect a real bank with Plaid">
          To pull live balances and see “how much was deposited last month” automatically, we'll connect
          <b> Plaid</b> (the service that securely links banks to apps). That needs a free Plaid developer
          account and a small backend to hold the keys safely — I've built this page so it drops right in
          when you're ready. For now you can enter balances manually below.
        </IntegrationNote>
      </div>

      <Card className="p-5 mb-6">
        <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>Total across accounts</p>
        <p className="text-3xl font-bold mt-1" style={{ color: 'var(--color-accent)' }}>{money(total)}</p>
      </Card>

      <Card className="p-5">
        <h2 className="font-bold text-lg mb-3" style={{ color: 'var(--color-text)' }}>Accounts</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Account name" className="max-w-xs" />
          <select
            value={draft.type}
            onChange={(e) => setDraft({ ...draft, type: e.target.value })}
            className="rounded-xl px-3 py-2 text-sm outline-none"
            style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
          >
            {['Checking', 'Savings', 'Credit', 'Cash', 'Investment'].map((t) => <option key={t}>{t}</option>)}
          </select>
          <Input value={draft.balance} onChange={(e) => setDraft({ ...draft, balance: e.target.value })} placeholder="Balance" type="number" className="max-w-[140px]" />
          <Button
            onClick={() => {
              const balance = parseFloat(draft.balance)
              if (!draft.name.trim() || isNaN(balance)) return
              setAccounts((p) => [...p, { id: uid('acct'), name: draft.name.trim(), type: draft.type, balance }])
              setDraft({ name: '', type: 'Checking', balance: '' })
            }}
          >
            <IconPlus width={16} height={16} /> Add
          </Button>
        </div>

        {accounts.length === 0 ? (
          <EmptyState icon={<IconBank width={40} height={40} />} title="No accounts yet" hint="Add one above to start tracking balances." />
        ) : (
          <ul className="flex flex-col gap-2">
            {accounts.map((a) => (
              <li key={a.id} className="group flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--color-bg)' }}>
                <div className="h-10 w-10 rounded-xl grid place-items-center shrink-0" style={{ background: 'var(--color-surface)' }}>
                  <IconBank width={20} height={20} style={{ color: 'var(--color-accent)' }} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold" style={{ color: 'var(--color-text)' }}>{a.name}</div>
                  <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{a.type}</div>
                </div>
                <input
                  type="number"
                  value={a.balance}
                  onChange={(e) => setAccounts((p) => p.map((x) => x.id === a.id ? { ...x, balance: parseFloat(e.target.value) || 0 } : x))}
                  className="w-32 text-right font-bold bg-transparent outline-none"
                  style={{ color: 'var(--color-text)' }}
                />
                <button onClick={() => setAccounts((p) => p.filter((x) => x.id !== a.id))} className="opacity-0 group-hover:opacity-60" style={{ color: 'var(--color-muted)' }}>
                  <IconTrash width={16} height={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
