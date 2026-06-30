import { useState } from 'react'
import { Card, PageHeader, Button, Input, EmptyState, IntegrationNote } from '../components/ui'
import { IconPlus, IconTrash, IconSearch, IconWishlist } from '../components/icons'
import { useStore, uid } from '../lib/store'

type Product = {
  id: string
  name: string
  price: string
  rating: number // 0-5
  link: string
  image: string
  notes: string
  bought: boolean
}

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange?.(n)}
          className="text-lg leading-none"
          style={{ color: n <= value ? 'var(--color-accent)' : 'var(--color-border)', cursor: onChange ? 'pointer' : 'default' }}
          aria-label={`${n} stars`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export default function Wishlist() {
  const [items, setItems] = useStore<Product[]>('wishlist', [])
  const [query, setQuery] = useState('')

  const add = (name: string) => {
    const n = name.trim()
    if (!n) return
    setItems((prev) => [
      ...prev,
      { id: uid('p'), name: n, price: '', rating: 0, link: '', image: '', notes: '', bought: false },
    ])
    setQuery('')
  }

  const update = (id: string, patch: Partial<Product>) =>
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  const remove = (id: string) => setItems((prev) => prev.filter((p) => p.id !== id))

  return (
    <div>
      <PageHeader
        title="Wishlist"
        subtitle="Research products side by side — compare price, ratings and your own notes."
        action={
          <form onSubmit={(e) => { e.preventDefault(); add(query) }} className="flex gap-2">
            <div className="relative">
              <IconSearch width={16} height={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-muted)' }} />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Add a product to compare…" className="!pl-9 w-72" />
            </div>
            <Button type="submit"><IconPlus width={16} height={16} /> Add</Button>
          </form>
        }
      />

      <div className="mb-6">
        <IntegrationNote title="Live product search (coming with an API key)">
          Right now you build the comparison by hand — perfect for tracking things you're researching.
          Next phase we can wire in live search & reviews (Amazon Product API, Google Shopping, or RapidAPI)
          so typing a product auto-fills price, image and ratings, plus shows similar items to compare.
        </IntegrationNote>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={<IconWishlist width={44} height={44} />} title="Your wishlist is empty" hint="Add a product above to start a side-by-side comparison." />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {items.map((p) => (
            <Card key={p.id} className="p-4 shrink-0 w-72 flex flex-col" style={{ opacity: p.bought ? 0.6 : 1 }}>
              <div
                className="h-36 rounded-xl mb-3 grid place-items-center overflow-hidden"
                style={{ background: 'var(--color-bg)' }}
              >
                {p.image ? (
                  <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <IconWishlist width={36} height={36} style={{ color: 'var(--color-border)' }} />
                )}
              </div>

              <div className="flex items-start justify-between gap-2">
                <input
                  value={p.name}
                  onChange={(e) => update(p.id, { name: e.target.value })}
                  className="font-semibold bg-transparent outline-none w-full"
                  style={{ color: 'var(--color-text)' }}
                />
                <button onClick={() => remove(p.id)} style={{ color: 'var(--color-muted)' }}>
                  <IconTrash width={16} height={16} />
                </button>
              </div>

              <div className="flex items-center justify-between mt-2 mb-2">
                <Stars value={p.rating} onChange={(v) => update(p.id, { rating: v })} />
                <input
                  value={p.price}
                  onChange={(e) => update(p.id, { price: e.target.value })}
                  placeholder="$ price"
                  className="w-20 text-right bg-transparent outline-none font-bold"
                  style={{ color: 'var(--color-accent)' }}
                />
              </div>

              <Input
                value={p.link}
                onChange={(e) => update(p.id, { link: e.target.value })}
                placeholder="Link (URL)"
                className="mb-2 text-xs"
              />
              <textarea
                value={p.notes}
                onChange={(e) => update(p.id, { notes: e.target.value })}
                placeholder="Notes, pros & cons…"
                rows={3}
                className="rounded-xl px-3 py-2 text-sm outline-none resize-none mb-3"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              />

              <div className="mt-auto flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--color-muted)' }}>
                  <input type="checkbox" checked={p.bought} onChange={(e) => update(p.id, { bought: e.target.checked })} />
                  Bought
                </label>
                {p.link && (
                  <a href={p.link} target="_blank" rel="noreferrer" className="ml-auto text-xs font-semibold" style={{ color: 'var(--color-accent)' }}>
                    Open ↗
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
