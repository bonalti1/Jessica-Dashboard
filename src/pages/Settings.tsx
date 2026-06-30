import { Card, PageHeader, Button, Input } from '../components/ui'
import { useTheme, PRESETS, type Theme } from '../lib/theme'
import { useStore } from '../lib/store'
import { CURRENCIES } from '../lib/format'

const FIELDS: { key: keyof Theme; label: string }[] = [
  { key: 'sidebar', label: 'Sidebar (top)' },
  { key: 'sidebar2', label: 'Sidebar (bottom)' },
  { key: 'accent', label: 'Accent / highlight' },
  { key: 'bg', label: 'Background' },
  { key: 'surface', label: 'Cards' },
  { key: 'text', label: 'Text' },
  { key: 'border', label: 'Borders' },
]

export default function Settings() {
  const { theme, setTheme, applyPreset } = useTheme()
  const [profile, setProfile] = useStore<{ name: string; photo?: string }>('profile', { name: 'Jessica' })
  const [currency, setCurrency] = useStore<string>('currency', 'USD')

  const setField = (key: keyof Theme, value: string) => setTheme({ ...theme, [key]: value })

  const install = async () => {
    const bip = (window as unknown as { __bip?: { prompt: () => void; userChoice: Promise<unknown> } }).__bip
    if (bip) { bip.prompt(); await bip.userChoice } else {
      alert('To install: open this site in your phone browser, tap Share, then "Add to Home Screen".')
    }
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Make the dashboard yours — profile, currency, theme and your data." />

      <Card className="p-5 mb-6">
        <h2 className="font-bold text-lg mb-4" style={{ color: 'var(--color-text)' }}>Profile</h2>
        <div className="flex items-start gap-5 flex-wrap">
          <label className="cursor-pointer relative group shrink-0">
            {profile.photo
              ? <img src={profile.photo} alt="" className="h-16 w-16 rounded-full object-cover" />
              : <div className="h-16 w-16 rounded-full grid place-items-center font-bold text-2xl" style={{ background: 'var(--color-accent)', color: 'var(--color-on-accent)' }}>{(profile.name || 'J').charAt(0).toUpperCase()}</div>}
            <span className="absolute inset-0 rounded-full grid place-items-center text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition" style={{ background: 'rgba(0,0,0,0.45)', color: '#fff' }}>Photo</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => setProfile({ ...profile, photo: r.result as string }); r.readAsDataURL(f) }} />
          </label>
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm block mb-1" style={{ color: 'var(--color-muted)' }}>Name (greeting + signature)</label>
            <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Jessica Peña" className="max-w-sm" />
            {profile.photo && <button onClick={() => setProfile({ ...profile, photo: undefined })} className="text-xs mt-2" style={{ color: 'var(--color-muted)' }}>Remove photo</button>}
          </div>
          <div>
            <label className="text-sm block mb-1" style={{ color: 'var(--color-muted)' }}>Currency</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="rounded-xl px-3 py-2 text-sm outline-none" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
          <Button variant="outline" onClick={install}>📲 Install app on this device</Button>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="font-bold text-lg mb-4" style={{ color: 'var(--color-text)' }}>Color themes</h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(PRESETS).map(([name, preset]) => (
              <button
                key={name}
                onClick={() => applyPreset(name)}
                className="rounded-xl p-3 text-left transition hover:scale-[1.02]"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}
              >
                <div className="flex gap-1 mb-2">
                  {[preset.sidebar, preset.accent, preset.surface].map((c, i) => (
                    <span key={i} className="h-6 w-6 rounded-full" style={{ background: c, border: '1px solid rgba(0,0,0,0.1)' }} />
                  ))}
                </div>
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{name}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-bold text-lg mb-4" style={{ color: 'var(--color-text)' }}>Custom colors</h2>
          <div className="flex flex-col gap-3">
            {FIELDS.map(({ key, label }) => (
              <label key={key} className="flex items-center justify-between gap-3">
                <span className="text-sm" style={{ color: 'var(--color-text)' }}>{label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono" style={{ color: 'var(--color-muted)' }}>{theme[key]}</span>
                  <input
                    type="color"
                    value={theme[key]}
                    onChange={(e) => setField(key, e.target.value)}
                    className="h-8 w-12 rounded cursor-pointer bg-transparent"
                  />
                </div>
              </label>
            ))}
          </div>
          <Button variant="outline" className="mt-5" onClick={() => applyPreset('Noir Lavender')}>Reset to default</Button>
        </Card>
      </div>

      <Card className="p-5 mt-6">
        <h2 className="font-bold text-lg mb-2" style={{ color: 'var(--color-text)' }}>Data</h2>
        <p className="text-sm mb-4" style={{ color: 'var(--color-muted)' }}>
          Everything you enter is saved privately in this browser. Use these to back up or move your data.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const dump: Record<string, unknown> = {}
              for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i)
                if (k?.startsWith('jess:')) dump[k] = JSON.parse(localStorage.getItem(k) || 'null')
              }
              const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' })
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob)
              a.download = 'jessica-dashboard-backup.json'
              a.click()
            }}
          >
            Export backup
          </Button>
          <label className="inline-flex">
            <Button variant="outline" onClick={(e) => (e.currentTarget.nextElementSibling as HTMLInputElement)?.click()}>
              Import backup
            </Button>
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                file.text().then((txt) => {
                  try {
                    const data = JSON.parse(txt) as Record<string, unknown>
                    Object.entries(data).forEach(([k, v]) => {
                      if (k.startsWith('jess:')) localStorage.setItem(k, JSON.stringify(v))
                    })
                    location.reload()
                  } catch {
                    alert('That file could not be read.')
                  }
                })
              }}
            />
          </label>
        </div>
      </Card>
    </div>
  )
}
