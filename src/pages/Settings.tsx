import { Card, PageHeader, Button, Input } from '../components/ui'
import { useTheme, PRESETS, type Theme } from '../lib/theme'
import { useStore } from '../lib/store'

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
  const [profile, setProfile] = useStore<{ name: string }>('profile', { name: 'Jessica' })

  const setField = (key: keyof Theme, value: string) => setTheme({ ...theme, [key]: value })

  return (
    <div>
      <PageHeader title="Settings" subtitle="Make the dashboard yours — pick a palette or fine-tune every color." />

      <Card className="p-5 mb-6">
        <h2 className="font-bold text-lg mb-3" style={{ color: 'var(--color-text)' }}>Profile</h2>
        <label className="text-sm block mb-1" style={{ color: 'var(--color-muted)' }}>Name (used in the greeting and signature)</label>
        <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Jessica Peña" className="max-w-sm" />
        <p className="text-xs mt-2" style={{ color: 'var(--color-muted)' }}>Tip: include a last name (e.g. “Jessica Peña”) to show it on two lines in the sidebar signature.</p>
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
